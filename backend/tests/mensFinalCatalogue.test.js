import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {productSchema} from '../src/middleware/validate.js';
import {MENS_FINAL_PRODUCTS,MENS_FINAL_NAMES,FINAL_BOTTOMWEAR_PRODUCTS,FINAL_WINTERWEAR_PRODUCTS,FINAL_ACCESSORY_PRODUCTS,MENS_BOTTOMWEAR_EDITORIAL,planMensFinalImport} from '../scripts/mensFinalCatalogue.js';
import {MENS_CLOTHING_NAMES} from '../scripts/mensClothingCatalogue.js';
import {FOOTWEAR_NAMES} from '../scripts/footwearCatalogue.js';
const publicRoot=fileURLToPath(new URL('../../frontend/public/',import.meta.url));
test('32 unique final screenshot products divided into the requested collections',()=>{
  assert.equal(FINAL_BOTTOMWEAR_PRODUCTS.length,12);
  assert.equal(FINAL_WINTERWEAR_PRODUCTS.length,15);
  assert.equal(FINAL_ACCESSORY_PRODUCTS.length,5);
  assert.equal(MENS_FINAL_PRODUCTS.length,32);
  assert.equal(new Set([...MENS_FINAL_NAMES,...MENS_CLOTHING_NAMES,...FOOTWEAR_NAMES]).size,60);
  assert.equal(MENS_BOTTOMWEAR_EDITORIAL.length,4);
});
test('all product images are local and all objects satisfy the database schema',()=>{
  const seen=new Set();
  for(const p of MENS_FINAL_PRODUCTS){
    assert.equal(productSchema.safeParse(p).success,true,`Invalid product ${p.name}: ${JSON.stringify(productSchema.safeParse(p).error?.issues)}`);
    assert.equal(p.category,'Men');
    assert.match(p.img,/^\/products\/men-(bottomwear|winterwear|accessories)\/[a-z0-9-]+\.webp$/);
    assert.equal(seen.has(p.img),false,`Repeated image ${p.img}`);
    seen.add(p.img);
    assert.ok(fs.statSync(path.join(publicRoot,p.img.slice(1))).size>4000,`Missing image ${p.img}`);
    if(p.originalPricePaise!=null)assert.ok(p.originalPricePaise>p.pricePaise);
  }
  for(const p of MENS_BOTTOMWEAR_EDITORIAL)assert.ok(fs.statSync(path.join(publicRoot,p.img.slice(1))).size>4000);
});
test('unpriced corduroy items cannot be sold until admin sets verified prices',()=>{
 const pending=MENS_FINAL_PRODUCTS.filter(p=>p.tag==='PRICE PENDING');
 assert.equal(pending.length,4);
 assert.ok(pending.every(p=>p.quantity===0 && p.inStock===false));
 assert.ok(MENS_FINAL_PRODUCTS.filter(p=>p.tag!=='PRICE PENDING').every(p=>p.inStock===true));
});
test('import only adds missing products and retains archived entries',()=>{
 const previous={name:MENS_FINAL_NAMES[0],active:true,pricePaise:42};
 const archived={name:MENS_FINAL_NAMES[31],active:false};
 const plan=planMensFinalImport([previous,archived]);
 assert.equal(plan.toCreate.length,30);
 assert.deepEqual(plan.alreadyPresent,[previous,archived]);
 assert.equal(previous.pricePaise,42);
 assert.equal(planMensFinalImport(MENS_FINAL_PRODUCTS).toCreate.length,0);
 assert.throws(()=>planMensFinalImport([previous,previous]),/Duplicate/);
});
