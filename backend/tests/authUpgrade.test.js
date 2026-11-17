import { before, after, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import app from '../src/app.js';
import User from '../src/models/User.js';
import EmailOtp from '../src/models/EmailOtp.js';
import GoogleChallenge from '../src/models/GoogleChallenge.js';
import { googleClient, verifyGoogleCredential } from '../src/services/googleIdentity.js';
import { requestRecovery, resetPassword } from '../src/services/passwordRecovery.js';
import { sendEmail } from '../src/services/emailService.js';
import { sanitizeLog } from '../src/config/logger.js';
const origin='http://localhost:5173', audience='test-client.apps.googleusercontent.com', email='google@example.test', password='Password123!';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const wrongKey=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
let db,mails=[],failMail=false;
before(async()=>{
 process.env.NODE_ENV='test'; process.env.JWT_SECRET='auth-upgrade-test-secret-longer-than-32-characters';
 process.env.GOOGLE_CLIENT_ID=audience; process.env.CLIENT_ORIGIN=origin; process.env.EMAIL_USER='sender@example.test';process.env.EMAIL_PASS='test-only';
 delete process.env.VITE_GOOGLE_CLIENT_ID;
 mock.method(googleClient,'getFederatedSignonCertsAsync',async()=>({certs:{test:publicKey.export({type:'spki',format:'pem'})},format:'PEM'}));
 mock.method(nodemailer,'createTransport',()=>({sendMail:async mail=>{ if(failMail)throw Error('private-provider-error');mails.push(mail);return {accepted:[mail.to]};}}));
 db=await MongoMemoryReplSet.create({replSet:{count:1}});await mongoose.connect(db.getUri());
 await Promise.all([User.init(),EmailOtp.init(),GoogleChallenge.init()]);
});
after(async()=>{mock.restoreAll();await mongoose.disconnect();await db?.stop();});
beforeEach(async()=>{await Promise.all([User.deleteMany({}),EmailOtp.deleteMany({}),GoogleChallenge.deleteMany({})]);mails=[];failMail=false;});
function credential(nonce,changes={},key=privateKey){const now=Math.floor(Date.now()/1000);return jwt.sign({iss:'https://accounts.google.com',aud:audience,sub:'google-subject-1',email,email_verified:true,name:'Google Buyer',nonce,iat:now,exp:now+300,...changes},key,{algorithm:'RS256',keyid:'test'});}
async function google(agent=request.agent(app),changes={}) {const ch=await agent.post('/api/auth/google/challenge').set('Origin',origin).send({}).expect(200);const body={credential:credential(ch.body.nonce,changes)};return {agent,body,post:()=>agent.post('/api/auth/google').set('Origin',origin).send(body)};}
const otp=()=>mails.findLast(m=>m.subject.includes('Verify')).text.match(/code is: (\d{6})/)[1];
const recoveryCode=()=>mails.findLast(m=>m.subject.includes('recovery')).text.match(/code is: (\d{6})/)[1];
const login=(address=email,pass=password)=>request(app).post('/api/auth/login').send({email:address,password:pass});
async function local(extra={}){return User.create({name:'Existing',email,passwordHash:await bcrypt.hash(password,4),emailVerified:true,...extra});}
const bearer=user=>jwt.sign({sv:user.sessionVersion||0},process.env.JWT_SECRET,{subject:user.id,expiresIn:'1h'});

test('first Google registration has no session/password until own OTP, then returning Google signs in without another mail',async()=>{
 const first=await google();const r=await first.post().expect(201);assert.equal(r.body.token,undefined);assert.equal(r.body.retryAfter,60);
 let user=await User.findOne({email}).select('+passwordHash +googleSub');assert.equal(user.passwordHash,undefined);assert.equal(user.googleSub,'google-subject-1');assert.equal(user.role,'customer');
 await request(app).get('/api/cart').set('Authorization',`Bearer ${bearer(user)}`).expect(403);
 const verified=await request(app).post('/api/auth/verify-email').send({email,otp:otp()}).expect(200);assert.ok(verified.body.token);
 await request(app).get('/api/auth/me').set('Authorization',`Bearer ${verified.body.token}`).expect(200);
 const returning=await google();const signed=await returning.post().expect(200);assert.equal(signed.body.user.id,user.id);assert.ok(signed.body.token);assert.equal(mails.filter(m=>m.subject.includes("Welcome to GAZU")).length,1);
 await login().expect(401);await first.post().expect(401);
});
test('pending Google re-entry resumes without duplicate account or automatic resend',async()=>{
 await (await google()).post().expect(201);const second=await (await google()).post().expect(200);
 assert.equal(second.body.requiresVerification,true);assert.equal(mails.length,1);assert.equal(await User.countDocuments(),1);
});
test('matching email never auto-links an existing password account',async()=>{
 const user=await local();await (await google()).post().expect(409);
 assert.equal(await User.countDocuments(),1);assert.equal((await User.findById(user.id).select('+googleSub')).googleSub,undefined);assert.ok((await login().expect(200)).body.token);
});
test('disabled linked identity and existing JWT are denied',async()=>{
 const user=await local({googleSub:'google-subject-1',disabled:true});await (await google()).post().expect(403);await login().expect(403);
 await request(app).get('/api/auth/me').set('Authorization',`Bearer ${bearer(user)}`).expect(403);
});
test('SMTP failure leaves Google registration recoverable without activation or leaking provider details',async()=>{
 failMail=true;const r=await (await google()).post().expect(503);assert.equal(r.body.requiresVerification,true);assert.ok(!JSON.stringify(r.body).includes('private-provider'));
 assert.equal((await User.findOne({email})).emailVerified,false);assert.equal(await User.countDocuments(),1);
});
test('Google challenge requires exact Origin, JSON, browser cookie and one-time nonce',async()=>{
 await request(app).post('/api/auth/google/challenge').send({}).expect(403);
 await request(app).post('/api/auth/google/challenge').set('Origin','https://attacker.test').send({}).expect(403);
 await request(app).post('/api/auth/google/challenge').set('Origin',origin).type('form').send('x=y').expect(400);
 const flow=await google();await request(app).post('/api/auth/google').set('Origin',origin).send(flow.body).expect(401);
 await GoogleChallenge.updateMany({},{$set:{expiresAt:new Date(0)}});await flow.post().expect(401);
});
for(const [name,changes,key] of [
 ['invalid signature',{},wrongKey],['incorrect audience',{aud:'attacker'}],['incorrect issuer',{iss:'https://attacker.test'}],
 ['expired token',{exp:1,iat:1}],['missing subject',{sub:''}],['missing email',{email:''}],['unverified email',{email_verified:false}],['wrong nonce',{nonce:'wrong'}]
])test(`Google rejects ${name} through official verifier and claim checks`,async()=>{
 await assert.rejects(verifyGoogleCredential(credential('expected',changes,key),'expected'),e=>e.status===401);
});
test('Google key-service failure is safe and does not expose raw token',async()=>{
 const method=mock.method(googleClient,'getFederatedSignonCertsAsync',async()=>{throw Error('network-private-data');});
 await assert.rejects(verifyGoogleCredential(credential('nonce'),'nonce'),e=>e.status===401&&!e.message.includes('private'));method.mock.restore();
});
test('linking requires current password and preserves existing user, role, and cart',async()=>{
 const product=new mongoose.Types.ObjectId();const user=await local({cart:[{product,quantity:2}]});const auth=`Bearer ${bearer(user)}`;
 const flow=await google();await flow.agent.post('/api/auth/link-google').set('Origin',origin).send({...flow.body,password}).expect(401);
 await flow.agent.post('/api/auth/link-google').set('Origin',origin).set('Authorization',auth).send({...flow.body,password:'WrongPass123'}).expect(403);
 await flow.agent.post('/api/auth/link-google').set('Origin',origin).set('Authorization',auth).send({...flow.body,password}).expect(200);
 const saved=await User.findById(user.id).select('+googleSub');assert.equal(saved.googleSub,'google-subject-1');assert.equal(saved.cart[0].quantity,2);assert.equal(saved.role,'customer');
 const r=await (await google()).post().expect(200);assert.equal(r.body.user.id,user.id);assert.equal(mails.length,0);
});
test('linking rejects different emails and unique Google subject collisions',async()=>{
 const user=await local();const flow=await google(undefined,{email:'other@example.test'});
 await flow.agent.post('/api/auth/link-google').set('Origin',origin).set('Authorization',`Bearer ${bearer(user)}`).send({...flow.body,password}).expect(409);
 await User.create({name:'Other',email:'other@example.test',googleSub:'reserved',emailVerified:true});
 await assert.rejects(User.create({name:'Collision',email:'third@example.test',googleSub:'reserved'}),e=>e.code===11000);
});
test('recovery response hides unknown accounts, cooldown and SMTP failure',async()=>{
 await local();const known=await requestRecovery(email),unknown=await requestRecovery('absent@example.test'),limited=await requestRecovery(email);
 assert.deepEqual(known,unknown);assert.deepEqual(known,limited);assert.equal(mails.length,1);
 await User.updateOne({email},{$set:{recoveryLastSentAt:new Date(0)}});failMail=true;assert.deepEqual(await requestRecovery(email),known);
});
test('reset changes password once, revokes old JWT, and preserves identity/cart',async()=>{
 const user=await local();const oldToken=bearer(user);await requestRecovery(email);const code=recoveryCode();
 const record=await User.findOne({email}).select('+recoveryHash');assert.notEqual(record.recoveryHash,code);
 await request(app).post('/api/auth/reset-password').send({email,code,password:'NewPassword123!',confirmPassword:'NewPassword123!'}).expect(200);
 await login().expect(401);await login(email,'NewPassword123!').expect(200);
 await request(app).get('/api/auth/me').set('Authorization',`Bearer ${oldToken}`).expect(401);
 await assert.rejects(resetPassword(email,code,'OtherPassword123!'),e=>e.status===400);assert.equal((await User.findOne({email})).id,user.id);
 assert.ok(mails.some(m=>m.subject.includes('Password changed')));
});
test('recovery expires and locks after five incorrect attempts; resend replaces code',async()=>{
 await local();await requestRecovery(email);let code=recoveryCode();const wrong=code==='000000'?'111111':'000000';
 for(let i=0;i<5;i++)await assert.rejects(resetPassword(email,wrong,password),e=>e.status===400);
 await assert.rejects(resetPassword(email,code,password),e=>e.status===400);
 await User.updateOne({email},{$set:{recoveryLastSentAt:new Date(0)}});await requestRecovery(email);code=recoveryCode();
 await User.updateOne({email},{$set:{recoveryExpiresAt:new Date(0)}});await assert.rejects(resetPassword(email,code,password),e=>e.status===400);
});
test('Google-only verified account can securely set password and still use Google',async()=>{
 const user=await User.create({name:'Google Buyer',email,googleSub:'google-subject-1',emailVerified:true});
 await requestRecovery(email);await resetPassword(email,recoveryCode(),password);const r=await login().expect(200);assert.equal(r.body.user.id,user.id);
 assert.ok((await (await google()).post().expect(200)).body.token);
});
test('recovery API validates confirmation and does not recover pending accounts',async()=>{
 await local({emailVerified:false});await request(app).post('/api/auth/forgot-password').send({email}).expect(200);assert.equal(mails.length,0);
 await request(app).post('/api/auth/reset-password').send({email,code:'123456',password,confirmPassword:'mismatch'}).expect(400);
 await request(app).post('/api/auth/register').send({name:'New',email:'new@example.test',password,confirmPassword:'mismatch'}).expect(400);
});
test('SMTP recipient rejection is failure and auth credential fields are redacted',async()=>{
 const method=mock.method(nodemailer,'createTransport',()=>({sendMail:async()=>({accepted:[],rejected:[email]})}));
 await assert.rejects(sendEmail(email,'GAZU test','Text'),/did not accept/);method.mock.restore();
 const safe=sanitizeLog({credential:'private',nonce:'private',recoveryHash:'private',googleSub:'private',requestId:'visible'});
 assert.ok(!JSON.stringify(safe).includes('private'));assert.equal(safe.requestId,'visible');
});
test('concurrent recovery submissions consume one code and increment the session version once',async()=>{
 const user=await local();await requestRecovery(email);const code=recoveryCode();
 const results=await Promise.all([resetPassword(email,code,'WinnerPassword123!'),resetPassword(email,code,'WinnerPassword123!')].map(p=>p.then(()=>200,e=>e.status)));
 assert.deepEqual(results.sort(),[200,400]);assert.equal((await User.findById(user.id)).sessionVersion,1);
});
test('recovery hourly send cap remains after replacement requests',async()=>{
 await local();for(let i=0;i<6;i++){await User.updateOne({email},{$set:{recoveryLastSentAt:new Date(0)}});await requestRecovery(email);}
 assert.equal(mails.length,5);assert.equal((await User.findOne({email})).recoverySendCount,5);
});
test('same Google browser challenge cannot succeed concurrently twice',async()=>{
 const user=await local({googleSub:'google-subject-1'});const flow=await google();
 const results=await Promise.all([flow.post(),flow.post()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,401]);
 assert.equal(await User.countDocuments(),1);assert.equal(results.find(r=>r.status===200).body.user.id,user.id);
});
