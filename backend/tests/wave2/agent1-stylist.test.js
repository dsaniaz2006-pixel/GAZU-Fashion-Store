import {test} from 'node:test';import assert from 'node:assert/strict';
import {products} from './fixtures.js';
import {createStyleEdit,validateStyleProfile} from '../../src/services/wave2/stylist.js';
// Red/green requirements: safe price bounds, correct categories, no catalogue mutations.
test('agent1 unit: validates style, occasion, department and budget',()=>{
 assert.equal(validateStyleProfile({style:'street',category:'Women',budgetRupees:2000}).style,'street');
 assert.throws(()=>validateStyleProfile({style:'evil'}));assert.throws(()=>validateStyleProfile({budgetRupees:-5}));
});
test('agent1 unit: preference changes the ranking based on evidence',()=>{
 const heritage=createStyleEdit(products,{style:'heritage',budgetRupees:20000});
 assert.equal(heritage.items[0].category,'Men');assert.ok(heritage.items.every(p=>p.pricePaise<=2000000));
});
test('agent1 integration: finds only in-stock and published Mongo-shaped products',()=>{
 const r=createStyleEdit(products,{category:'Men',budgetRupees:1500});
 assert.deepEqual(r.items.map(p=>p.name),['Minimal Cotton Tee']);
});
test('agent1 TDD regression: empty or unaffordable catalogue yields no fabricated items',()=>{
 const r=createStyleEdit(products,{category:'Women',budgetRupees:900});assert.equal(r.items.length,0);assert.equal(r.total,0);
});
test('agent1 TDD regression: result cannot mutate catalogue prices or products',()=>{
 const source=JSON.stringify(products);createStyleEdit(products,{style:'minimal'});assert.equal(JSON.stringify(products),source);
});
