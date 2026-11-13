import{test}from'node:test';import assert from'node:assert/strict';import{earnedPoints}from'../../src/domain/loyalty.mjs';
test('one reward point per ₹100 only after delivered',()=>{assert.equal(earnedPoints({status:'placed',totalPaise:99900}),0);assert.equal(earnedPoints({status:'delivered',totalPaise:99900}),9);assert.equal(earnedPoints({status:'delivered',totalPaise:10000}),1)});
test('invalid order totals never earn points',()=>assert.equal(earnedPoints({status:'delivered',totalPaise:-100}),0));
