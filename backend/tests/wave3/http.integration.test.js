// Real Express HTTP contracts with isolated model stubs — NEVER reads .env or live MongoDB.
// Every one of the five Wave 3 workstreams has a route-level integration test.
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import Product from '../../src/models/Product.js';
import Order from '../../src/models/Order.js';
import User from '../../src/models/User.js';
import SupportTicket from '../../src/models/SupportTicket.js';
import AIAdminSuggestion from '../../src/models/AIAdminSuggestion.js';
const customerId='507f1f77bcf86cd799439091',orderId='507f1f77bcf86cd799439092',productId='507f1f77bcf86cd799439093',otherId='507f1f77bcf86cd799439094';
process.env.JWT_SECRET='wave3_contract_test_only_32_character_secret';process.env.GAZU_AI_PROVIDER='mock';
const token=id=>jwt.sign({sub:id,sv:0},process.env.JWT_SECRET,{algorithm:'HS256'});
function withUser(role='customer') {return mock.method(User,'findById',async()=>({id:customerId,role,emailVerified:true,sessionVersion:0}));}
function product(){return {_id:productId,name:'Verified Tee',active:true,publicationStatus:'published',category:'Men',type:'T-Shirts',description:'A verified casual tee.',color:'white',pricePaise:129900,quantity:4,inStock:true,variants:[{size:'M',quantity:4}],fitData:{source:'Verified manufacturer body chart',verified:true,measurementType:'body',unit:'cm',rows:[{size:'M',chestMinCm:95,chestMaxCm:102}]}};}
test('agent1 integration: public fit endpoint uses verified product data and does not write',async()=>{
 const stub=mock.method(Product,'findOne',()=>({lean:async()=>product()}));
 try{const result=await request(app).post('/api/wave3/fit/recommend').send({productId,chestCm:98}).expect(200);assert.equal(result.body.recommendedSize,'M');await request(app).post('/api/wave3/fit/recommend').send({productId,chestCm:1000}).expect(400);}finally{stub.mock.restore();}
});
test('agent2 integration: private order lookups are ownership-scoped and cannot see another user',async()=>{
 await request(app).post('/api/wave3/support/ask').send({message:'where is order',orderId}).expect(401);
 const user=withUser();const order=mock.method(Order,'findOne',(filter)=>{assert.equal(String(filter.user),customerId);return {lean:async()=>null};});
 try{await request(app).post('/api/wave3/support/ask').set('Authorization',`Bearer ${token(customerId)}`).send({message:'where is my parcel',orderId}).expect(404);assert.equal(order.mock.callCount(),1);}finally{order.mock.restore();user.mock.restore();}
});
test('agent2 integration: support ticket creation requires identity and a real owned order',async()=>{
 const user=withUser();const exists=mock.method(Order,'exists',async filter=>{assert.equal(String(filter.user),customerId);return true;});const create=mock.method(SupportTicket,'create',async value=>({id:otherId,status:'open',category:value.category}));
 try{const r=await request(app).post('/api/wave3/support/tickets').set('Authorization',`Bearer ${token(customerId)}`).send({message:'I want to return my parcel',orderId}).expect(201);assert.equal(r.body.category,'return');assert.equal(create.mock.calls[0].arguments[0].user,customerId);}finally{exists.mock.restore();create.mock.restore();user.mock.restore();}
});
test('agent3 integration: language discovery public; Hindi/Punjabi chat keeps same login requirement',async()=>{
 const listing=await request(app).get('/api/wave3/languages').expect(200);assert.deepEqual(listing.body.items.map(x=>x.code),['en','hi','pa']);
 for(const language of ['en','hi','pa'])await request(app).post('/api/wave2/chat').send({message:'shirt please',language}).expect(401);
});
test('agent4 integration: only inventory staff may draft catalogue changes',async()=>{
 const user=withUser('customer');try{await request(app).post(`/api/wave3/admin/products/${productId}/suggestion`).set('Authorization',`Bearer ${token(customerId)}`).expect(403);}finally{user.mock.restore();}
 const staff=withUser('inventory_manager');const find=mock.method(Product,'findOne',()=>({lean:async()=>product()}));const create=mock.method(AIAdminSuggestion,'create',async value=>({id:otherId,...value}));
 try{const r=await request(app).post(`/api/wave3/admin/products/${productId}/suggestion`).set('Authorization',`Bearer ${token(customerId)}`).expect(201);assert.equal(r.body.status,'pending');assert.equal(r.body.proposal.pricePaise,undefined);}finally{create.mock.restore();find.mock.restore();staff.mock.restore();}
});
test('agent5 integration: forecasts are staff-only, bounded and read-only',async()=>{
 const customer=withUser();try{await request(app).get('/api/wave3/admin/forecast').set('Authorization',`Bearer ${token(customerId)}`).expect(403);}finally{customer.mock.restore();}
 const staff=withUser('admin');const items=mock.method(Product,'find',()=>({select(){return this;},limit(){return this;},async lean(){return [product()];}}));const orders=mock.method(Order,'find',()=>({select(){return this;},sort(){return this;},limit(){return this;},async lean(){return [];}}));
 try{const r=await request(app).get('/api/wave3/admin/forecast?days=28&horizon=7').set('Authorization',`Bearer ${token(customerId)}`).expect(200);assert.equal(r.body.actionTaken,false);assert.equal(r.body.items[0].forecast.reliability,'insufficient');await request(app).get('/api/wave3/admin/forecast?days=1').set('Authorization',`Bearer ${token(customerId)}`).expect(400);}finally{orders.mock.restore();items.mock.restore();staff.mock.restore();}
});
