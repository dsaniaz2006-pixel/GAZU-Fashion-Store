import{test}from'node:test';import assert from'node:assert/strict';import{sanitizeEvent}from'../../src/domain/events.mjs';
test('analytics stores only allowlisted fields',()=>assert.deepEqual(sanitizeEvent({type:'search',email:'secret',q:'medical data'}),{type:'search'}));
test('invalid event is rejected',()=>assert.throws(()=>sanitizeEvent({type:'execute_script'}),/Unsupported/));
