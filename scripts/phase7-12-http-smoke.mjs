import {test} from 'node:test';import assert from 'node:assert/strict';
const base=process.env.GAZU_BASE_URL||'http://localhost:5173';
test('Vite serves the GAZU SPA',async()=>{const response=await fetch(base);assert.equal(response.status,200);assert.match(await response.text(),/GAZU|root/i)});
test('public collection route is resolvable',async()=>{const response=await fetch(`${base}/style-finder`);assert.equal(response.status,200)});
