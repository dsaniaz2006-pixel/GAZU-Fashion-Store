import {test} from 'node:test';import assert from 'node:assert/strict';
import {products} from './fixtures.js';
import {recommendProducts} from '../../src/services/wave2/recommendations.js';
test('agent5 unit: recommends sellable pieces by style',()=>{const r=recommendProducts(products,{style:'heritage'});assert.ok(r.items.length>0);assert.equal(r.mode,'style-discovery');});
test('agent5 integration: owned wishlist item is excluded and shapes the recommendation',()=>{const r=recommendProducts(products,{wishlist:[products[0]._id]});assert.ok(!r.items.some(p=>p._id===products[0]._id));assert.equal(r.personalized,true);});
test('agent5 integration: department limits suggestions to real inventory',()=>{const r=recommendProducts(products,{category:'Women'});assert.equal(r.items.length,0);});
test('agent5 TDD security: unavailable, draft and archived items never appear',()=>{const r=recommendProducts(products);assert.ok(r.items.every(p=>products.find(x=>x._id===p._id)?.quantity>0));assert.ok(!r.items.some(p=>p.name==='Unpublished Jacket'));});
test('agent5 TDD regression: invalid input is not silently accepted',()=>{assert.throws(()=>recommendProducts(products,{limit:999}));assert.throws(()=>recommendProducts(products,{style:'not-a-style'}));});
test('agent5 TDD AI security: semantic suggestions are only ranking hints, not new inventory',()=>{
 const r=recommendProducts(products,{semanticIds:[products[1]._id,'unlisted-secret-sku',products[7]._id]});
 assert.ok(r.items.every(x=>products.some(p=>p._id===x._id&&p.active&&p.quantity>0)));
 assert.equal(r.mode,'semantic-personalized');
});
