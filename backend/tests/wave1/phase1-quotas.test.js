import{test,mock}from'node:test';import assert from'node:assert/strict';
import AIQuota from '../../src/models/AIQuota.js';import AIUsage from '../../src/models/AIUsage.js';
import{reserveAIRequest,recordAIUsage}from'../../src/services/ai/usageTracker.js';
test('AI token and request reservations are atomic against a daily quota model',async()=>{
 const mocks=[];
 try{mocks.push(mock.method(AIQuota,'findOneAndUpdate',async()=>({requests:2})));mocks.push(mock.method(AIUsage,'create',async()=>({})))
 const r=await reserveAIRequest({actor:{id:'u1'},kind:'chat',maxInput:1200});await recordAIUsage(r,{inputTokens:40,outputTokens:20});
 assert.equal(r.actor,'u1');assert.equal(mocks[0].mock.calls[0].arguments[0].actor,'u1');assert.ok(mocks[0].mock.calls[0].arguments[1].$inc.reservedTokens>0);assert.equal(mocks[1].mock.calls[0].arguments[0].inputTokens,40);
 }finally{for(const m of mocks.reverse())m.mock.restore();}
});
