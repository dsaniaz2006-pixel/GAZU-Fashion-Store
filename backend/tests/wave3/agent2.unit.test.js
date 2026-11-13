import {test} from 'node:test';import assert from 'node:assert/strict';
import {supportExplanation,classifySupportTicket,publicOrderSummary} from '../../src/services/wave3/support.js';
test('agent2 TDD: never invents delivery ETA from order status',()=>{const x=supportExplanation('where is my parcel',{status:'preparing',orderNumber:'G-42'});assert.match(x.answer,/prepar/i);assert.doesNotMatch(x.answer,/arrive on|tomorrow|guarantee/i);});
test('agent2 unit: owned order summary strips shipping private details',()=>{const x=publicOrderSummary({_id:'abc',orderNumber:'G-1',status:'placed',totalPaise:12000,shipping:{phone:'hidden'}});assert.equal(x.shipping,undefined);assert.equal(x.status,'placed');});
test('agent2 TDD: ambiguous return requests escalate rather than auto-approve',()=>{const x=supportExplanation('refund this order',null);assert.equal(x.needsHuman,true);assert.match(x.answer,/request|support/i);});
test('agent2 unit: ticket categories from bounded text',()=>{assert.equal(classifySupportTicket('I want to return an item'), 'return');assert.equal(classifySupportTicket('broken stitching'), 'product');});
