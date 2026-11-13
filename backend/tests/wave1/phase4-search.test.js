import{test}from'node:test';import assert from'node:assert/strict';
import{parseShoppingIntent,rankLexical,sortSearchItems}from'../../src/services/ai/smartSearch.js';
test('parses shopping intent with price, gender, style and color',()=>{const q=parseShoppingIntent('black oversized streetwear outfit for men under ₹3,000');assert.equal(q.category,'Men');assert.equal(q.maxPricePaise,300000);assert.equal(q.color,'black');assert.ok(q.searchTerms.includes('oversized'));});
test('lexical ranking prefers relevant items and never changes input',()=>{const p=[{name:'Blue Shirt',color:'Blue',styleTags:[]},{name:'Black Oversized Tee',color:'Black',styleTags:['streetwear']}];const x=rankLexical(p,'black oversized streetwear');assert.equal(x[0].name,'Black Oversized Tee');assert.equal(p[0].name,'Blue Shirt');});

test('customer price sort is preserved with AI search',()=>{const items=[{name:'Luxury Tee',pricePaise:300000},{name:'Budget Tee',pricePaise:80000}];assert.equal(sortSearchItems(items,'price_asc')[0].name,'Budget Tee');assert.equal(sortSearchItems(items,'price_desc')[0].name,'Luxury Tee');});
