import{test}from'node:test';import assert from'node:assert/strict';import{validateVariants}from'../../src/domain/inventory.mjs';
test('valid size stock totals are deterministic',()=>assert.equal(validateVariants([{size:'S',quantity:2},{size:'M',quantity:3}]),5));
test('duplicate or negative size inventory rejected',()=>{assert.throws(()=>validateVariants([{size:'M',quantity:1},{size:'m',quantity:1}]),/Duplicate/);assert.throws(()=>validateVariants([{size:'M',quantity:-1}]),/Invalid/)});
