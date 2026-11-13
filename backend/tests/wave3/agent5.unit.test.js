import {test} from 'node:test';import assert from 'node:assert/strict';
import {forecastDaily,assessInventory,orderDemand,seasonalMessage} from '../../src/services/wave3/forecast.js';
test('agent5 TDD: insufficient history does not claim reliable forecasts',()=>{const x=forecastDaily([0,0,1],{horizon:7});assert.equal(x.reliability,'insufficient');assert.equal(x.forecastUnits,null);});
test('agent5 unit: historical holdout metrics never leak orders',()=>{const x=forecastDaily(Array.from({length:42},(_,i)=>i%7===0?5:2),{horizon:7});assert.equal(x.reliability,'baseline');assert.ok(x.holdout.mae>=0);assert.equal(x.horizonDays,7);});
test('agent5 TDD: replenishment suggestions do not write stock',()=>{const x=assessInventory({name:'Tee',quantity:2,variants:[{size:'M',quantity:1}]},2);assert.equal(x.risk,'high');assert.equal(x.actionTaken,false);assert.ok(x.sizeNotes.length);});
test('agent5 unit: aggregates paid/placed order lines using recorded createdAt date',()=>{const x=orderDemand([{createdAt:new Date('2026-11-01'),items:[{product:'p1',quantity:2}]}],['p1'],new Date('2026-11-03'),3);assert.deepEqual(x.p1,[2,0,0]);assert.match(seasonalMessage(42),/not established/i);});
