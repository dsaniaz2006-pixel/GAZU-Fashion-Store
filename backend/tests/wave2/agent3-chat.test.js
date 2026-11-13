import {test} from 'node:test';import assert from 'node:assert/strict';
import {products} from './fixtures.js';
import {safeChatMessage,boundedConversation,groundedConversationProducts,ownsConversation,updateConversation} from '../../src/services/wave2/conversation.js';
test('agent3 unit: validates bounded shopping messages',()=>{assert.equal(safeChatMessage('  I need a tee  '),'I need a tee');assert.throws(()=>safeChatMessage('x'));assert.throws(()=>safeChatMessage('x'.repeat(701)));});
test('agent3 unit: retains last ten bounded messages',()=>{const r=boundedConversation(Array.from({length:30},(_,i)=>({role:'user',text:'a'.repeat(900)+i})));assert.equal(r.length,10);assert.ok(r.every(x=>x.text.length<=650));});
test('agent3 integration: grounding only exposes verified catalogue stock',()=>{const r=groundedConversationProducts(products);assert.ok(r.every(x=>x.quantity>0&&x.id));assert.ok(!r.some(x=>x.name==='Archived Dress'));});
test('agent3 TDD security: conversations are scoped to their owner',()=>{assert.equal(ownsConversation({user:'abc'},'abc'),true);assert.equal(ownsConversation({user:'abc'},'other'),false);});
test('agent3 TDD regression: repeated turns never exceed twelve stored messages',()=>{let r=[];for(let i=0;i<12;i++)r=updateConversation(r,'Need a tee','Try this product',[products[0]._id,products[0]._id]);assert.equal(r.length,12);assert.deepEqual(r.at(-1).productIds,[products[0]._id]);});
