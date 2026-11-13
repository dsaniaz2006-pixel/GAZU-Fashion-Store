import{test}from'node:test';import assert from'node:assert/strict';import{discountPaise,totalWithDiscount}from'../../src/domain/promotions.mjs';
test('percentage and fixed discount floor correctly in paise',()=>{assert.equal(discountPaise(99900,{kind:'percent',value:10}),9990);assert.equal(discountPaise(10000,{kind:'fixed',value:30000}),10000)});
test('gift credit never overdraws discounted subtotal',()=>{const t=totalWithDiscount(100000,{kind:'percent',value:10},1000000);assert.deepEqual(t,{discountPaise:10000,giftUsedPaise:90000,deliveryPaise:0,totalPaise:0})});
test('unreasonable percentage rejected',()=>assert.throws(()=>discountPaise(1000,{kind:'percent',value:100}),/Invalid/));
