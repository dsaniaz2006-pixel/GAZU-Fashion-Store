import{test}from'node:test';import assert from'node:assert/strict';
import{validateVariantSelection}from'../backend/src/domain/variants.mjs';
import{validateVariants}from'../backend/src/domain/inventory.mjs';
import{totalWithDiscount}from'../backend/src/domain/promotions.mjs';
import{earnedPoints}from'../backend/src/domain/loyalty.mjs';
test('size-level selection + discount + loyalty are arithmetically consistent',()=>{
 const variants=[{size:'M',quantity:3},{size:'L',quantity:1}];const p={quantity:validateVariants(variants),variants,inStock:true};
 assert.equal(validateVariantSelection(p,'M',2),2);
 const order=totalWithDiscount(150000,{kind:'percent',value:10},0);
 assert.equal(order.totalPaise,135000);
 assert.equal(earnedPoints({status:'delivered',totalPaise:order.totalPaise}),13);
});
