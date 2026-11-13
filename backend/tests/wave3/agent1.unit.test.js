import {test} from 'node:test';import assert from 'node:assert/strict';
import {recommendFit,compareFits} from '../../src/services/wave3/fit.js';
const fitData={verified:true,source:'Brand measurement table checked by staff',measuredAt:'2026-10-10',measurementType:'body',unit:'cm',rows:[{size:'S',chestMinCm:88,chestMaxCm:94},{size:'M',chestMinCm:95,chestMaxCm:102},{size:'L',chestMinCm:103,chestMaxCm:110}]};
test('agent1 TDD: cannot infer size from an unverified or incomplete chart',()=>{assert.equal(recommendFit({sizeGuide:'Size M recommended'},{chestCm:98}).recommendedSize,null);assert.equal(recommendFit({fitData:{...fitData,verified:false}},{chestCm:98}).confidence,'unavailable');});
test('agent1 unit: measured body range matches verified M with cautious confidence',()=>{const result=recommendFit({fitData,variants:[{size:'M',quantity:2}]},{chestCm:98,fitPreference:'regular'});assert.equal(result.recommendedSize,'M');assert.equal(result.confidence,'low');assert.match(result.explanation,/verified/i);});
test('agent1 TDD: unavailable variant does not recommend out-of-stock size',()=>{assert.equal(recommendFit({fitData,variants:[{size:'M',quantity:0}]},{chestCm:98}).recommendedSize,null);});
test('agent1 unit: compares only verified charts and never guarantees fit',()=>{const result=compareFits({name:'one',fitData},{name:'two',fitData},{chestCm:99});assert.equal(result.first.recommendedSize,'M');assert.equal(result.second.recommendedSize,'M');assert.match(result.notice,/not a guarantee/i);});

test('agent1 TDD: preference never becomes a fake measurement-based guarantee',()=>{const r=recommendFit({fitData},{chestCm:98,fitPreference:'oversized'});assert.equal(r.recommendedSize,'M');assert.match(r.explanation,/not a guarantee/i);});
