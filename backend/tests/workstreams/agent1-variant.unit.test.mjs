import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variantStock, cartVariantKey, validateVariantSelection } from '../../src/domain/variants.mjs';
test('legacy products do not require size', () => {assert.equal(variantStock({quantity:5},''),5);assert.equal(validateVariantSelection({quantity:5},'',2),2);assert.throws(()=>validateVariantSelection({quantity:5},'M',1),/not offered/)});
test('variant selection requires available size', () => {const p={quantity:4,variants:[{size:'M',quantity:2},{size:'L',quantity:2}]};assert.throws(()=>validateVariantSelection(p,'',1),/Choose/);assert.equal(variantStock(p,'M'),2);assert.throws(()=>validateVariantSelection(p,'M',3),/available/);assert.equal(validateVariantSelection(p,'L',2),2)});
test('cart key distinguishes equal products with different sizes',()=>{assert.notEqual(cartVariantKey('abc','M'),cartVariantKey('abc','L'));assert.equal(cartVariantKey('abc'),cartVariantKey('abc',''))});
