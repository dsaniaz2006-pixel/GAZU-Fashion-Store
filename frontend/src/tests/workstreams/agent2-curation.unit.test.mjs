import {test} from 'node:test';import assert from 'node:assert/strict';import {curateLook,styleQuizResults} from '../../lib/curation.mjs';
const items=[{id:'1',name:'Oxford Shirt'},{id:'2',name:'Tailored Trousers'},{id:'3',name:'Penny Loafers'},{id:'4',name:'Leather Belt'},{id:'5',name:'Cargo Pants'}];
test('shop the look uses distinct actual catalog items',()=>assert.deepEqual(curateLook(items).map(i=>i.id),['1','2','3','4']));
test('style quiz excludes unsellable items',()=>assert.deepEqual(styleQuizResults([{id:'1',name:'Polo Shirt',pricePending:true},...items],'heritage').map(i=>i.id),['1','3','4']));
