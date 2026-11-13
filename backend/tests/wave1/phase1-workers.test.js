import{test,mock}from'node:test';import assert from'node:assert/strict';
import AIJob from '../../src/models/AIJob.js';import Product from '../../src/models/Product.js';
import AIProductDraft from '../../src/models/AIProductDraft.js';import {runOneAIJob} from '../../src/services/ai/aiJobs.js';import{createProvider}from'../../src/services/ai/modelProvider.js';
test('worker claims a queued tag job, creates draft and marks done',async()=>{
 const mocks=[];
 const job={_id:'507f1f77bcf86cd799439012',id:'507f1f77bcf86cd799439012',kind:'tag',product:'507f1f77bcf86cd799439011',attempts:1};
 const product={_id:job.product,id:job.product,active:true,name:'Beige Tee',category:'Men',type:'T-Shirts',description:'Soft tee',img:'photo-1521572163474-6864f9cf17ab',styleTags:[]};
 try{mocks.push(mock.method(AIJob,'findOneAndUpdate',async()=>job));mocks.push(mock.method(AIJob,'updateOne',async()=>({modifiedCount:1})));mocks.push(mock.method(Product,'findOne',async()=>product));mocks.push(mock.method(AIProductDraft,'create',async item=>({...item,id:'draft'})));
 const result=await runOneAIJob({provider:createProvider({provider:'mock'})});assert.equal(result.state,'done');assert.equal(mocks[1].mock.calls[0].arguments[1].$set.state,'done');
 }finally{for(const m of mocks.reverse())m.mock.restore();}
});
