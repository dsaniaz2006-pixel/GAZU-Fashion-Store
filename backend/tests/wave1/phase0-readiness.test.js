import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectCatalogue } from "../../src/services/ai/catalogueAudit.js";
const base = { _id: '507f1f77bcf86cd799439011',name:'Cotton Tee', category:'Men', type:'T-Shirts', img:'photo-1521572163474-6864f9cf17ab', pricePaise:129900, quantity:3, inStock:true, publicationStatus:'published',active:true, variants:[] };
test('read-only catalogue report detects duplicates and conflicting inventory', () => {
 const report=inspectCatalogue([base,{...base,_id:'507f1f77bcf86cd799439012',name:'cotton tee',quantity:0,inStock:true}]);
 assert.equal(report.scanned,2);assert.ok(report.findings.some(x=>x.code==='DUPLICATE_NAME'));assert.ok(report.findings.some(x=>x.code==='STOCK_MISMATCH'));assert.equal(report.mutated,false);
});
test('readiness validates category and variants without changing source', () => {
 const bad={...base,category:'Other',variants:[{size:'M',quantity:1}],quantity:5};const snapshot=JSON.stringify(bad);
 const result=inspectCatalogue([bad]);
 assert.ok(result.findings.some(x=>x.code==='CATEGORY_INVALID'));
 assert.ok(result.findings.some(x=>x.code==='VARIANT_TOTAL_MISMATCH'));
 assert.equal(JSON.stringify(bad),snapshot);
});
