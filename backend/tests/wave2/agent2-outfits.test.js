import {test} from 'node:test';import assert from 'node:assert/strict';
import {products} from './fixtures.js';
import {buildOutfit,outfitSlot,SLOTS} from '../../src/services/wave2/outfits.js';
test('agent2 unit: maps garment types to exactly one slot',()=>{
 assert.equal(outfitSlot(products[0]),'top');assert.equal(outfitSlot(products[1]),'bottom');assert.equal(outfitSlot(products[2]),'footwear');assert.equal(outfitSlot(products[4]),'accessory');
});
test('agent2 unit: has a bounded and correct total price',()=>{
 const r=buildOutfit(products,{budgetRupees:13000,style:'heritage'});
 assert.ok(r.totalPricePaise<=1300000);assert.equal(r.totalPricePaise,r.items.reduce((n,x)=>n+x.product.pricePaise,0));
});
test('agent2 integration: outfit is real, unique and never contains draft or sold-out',()=>{
 const r=buildOutfit(products,{budgetRupees:13000});
 assert.equal(new Set(r.items.map(x=>x.product._id)).size,r.items.length);
 assert.ok(r.items.every(x=>products.some(p=>p._id===x.product._id&&p.quantity>0&&p.publicationStatus==='published')));
});
test('agent2 TDD regression: sparse inventory explicitly lists missing slots',()=>{
 const r=buildOutfit(products.slice(0,1),{budgetRupees:1500});assert.equal(r.complete,false);assert.deepEqual(r.missingSlots,['bottom','outerwear','footwear','accessory']);
});
test('agent2 TDD regression: invalid and unavailable anchors are rejected',()=>{
 assert.throws(()=>buildOutfit(products,{budgetRupees:10000,anchorId:products[7]._id}),RangeError);
 assert.throws(()=>buildOutfit(products,{budgetRupees:299}),/Invalid/);
});
test('agent2 TDD AI security: suggestions cannot add draft, duplicate or overbudget products',()=>{
 const r=buildOutfit(products,{budgetRupees:3000,suggestedIds:[products[7]._id,products[6]._id,products[0]._id,products[0]._id]});
 assert.equal(r.totalPricePaise<=300000,true);assert.ok(r.items.every(x=>x.product._id!==products[7]._id&&x.product._id!==products[6]._id));
 assert.equal(new Set(r.items.map(x=>x.slot)).size,r.items.length);
});
