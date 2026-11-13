// End-to-end HTTP contract tests through the real Express app and isolated model stubs.
// No MongoDB credentials are loaded; no production or staging data is modified.
import {test,mock} from 'node:test';import assert from 'node:assert/strict';
import request from 'supertest';import jwt from 'jsonwebtoken';
import app from '../../src/app.js';import Product from '../../src/models/Product.js';import User from '../../src/models/User.js';
import AIShoppingConversation from '../../src/models/AIShoppingConversation.js';import {products} from './fixtures.js';
// Never invoke live Gemini during HTTP contract tests.
process.env.GAZU_AI_PROVIDER='mock';
const userId='507f1f77bcf86cd799439099';const otherId='507f1f77bcf86cd799439098';
function stubCatalogue(){return mock.method(Product,'find',()=>({select(){return this;},limit(){return this;},async lean(){return products;}}));}
function token(){process.env.JWT_SECRET=process.env.JWT_SECRET||'wave2_http_contract_test_secret_at_least_32_chars';return jwt.sign({sub:userId,sv:0},process.env.JWT_SECRET,{algorithm:'HS256'});}
function stubUser(){return mock.method(User,'findById',async()=>({id:userId,role:'customer',emailVerified:true,sessionVersion:0,stylePreference:'minimal',wishlist:[products[0]._id]}));}
test('agent1 E2E HTTP: validates budget and returns only real matching products',async()=>{
 const stub=stubCatalogue();try{
  await request(app).post('/api/wave2/stylist').send({style:'street',budgetRupees:-1}).expect(400);
  const res=await request(app).post('/api/wave2/stylist').send({style:'minimal',category:'Men',budgetRupees:1500}).expect(200);
  assert.deepEqual(res.body.items.map(x=>x.name),['Minimal Cotton Tee']);assert.equal(res.body.mode,'catalogue-curated');
 }finally{stub.mock.restore();}
});
test('agent2 E2E HTTP: outfit builder never manufactures unavailable pieces',async()=>{
 const stub=stubCatalogue();try{
  const res=await request(app).post('/api/wave2/outfits').send({style:'heritage',category:'Men',budgetRupees:1500}).expect(200);
  assert.ok(res.body.totalPricePaise<=150000);assert.ok(res.body.items.length<=1);assert.equal(res.body.complete,false);
  await request(app).post('/api/wave2/outfits').send({style:'bad'}).expect(400);
 }finally{stub.mock.restore();}
});
test('agent3 E2E HTTP: chat and conversation history reject guests',async()=>{
 await request(app).post('/api/wave2/chat').send({message:'Need a tee'}).expect(401);
 await request(app).get('/api/wave2/conversations').expect(401);
 await request(app).delete(`/api/wave2/conversations/${otherId}`).expect(401);
});
test('agent3 E2E HTTP: conversation lookup is scoped to authenticated user',async()=>{
 const u=stubUser();const find=mock.method(AIShoppingConversation,'findOne',()=>({lean:async()=>null}));
 try{
  const res=await request(app).get(`/api/wave2/conversations/${otherId}`).set('Authorization',`Bearer ${token()}`).expect(404);
  assert.equal(res.body.message,'Conversation not found.');
  assert.equal(String(find.mock.calls[0].arguments[0].user),userId);
 }finally{find.mock.restore();u.mock.restore();}
});
test('agent4 E2E HTTP: visual search requires authentication and real image bytes',async()=>{
 await request(app).post('/api/wave2/visual-search').attach('image',Buffer.from('fake'),'fake.jpg').expect(401);
 const u=stubUser();try{
  await request(app).post('/api/wave2/visual-search').set('Authorization',`Bearer ${token()}`).attach('image',Buffer.from('not an image'),{filename:'test.png',contentType:'image/png'}).expect(400);
 }finally{u.mock.restore();}
});
test('agent5 E2E HTTP: recommendations require authentication and use only own wishlist',async()=>{
 await request(app).get('/api/wave2/recommendations').expect(401);
 const u=stubUser(),p=stubCatalogue();try{
  const res=await request(app).get('/api/wave2/recommendations?limit=5').set('Authorization',`Bearer ${token()}`).expect(200);
  assert.equal(res.body.personalized,true);assert.ok(res.body.items.every(item=>item._id!==products[0]._id));
 }finally{p.mock.restore();u.mock.restore();}
});
