import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const run=env=>execFileSync(process.execPath,['--input-type=module','-e',`await import('./backend/src/config/env.js'); console.log(process.env.GOOGLE_CLIENT_ID === 'public-test.apps.googleusercontent.com');`],{cwd:new URL('..',import.meta.url),env:{...process.env,GOOGLE_CLIENT_ID:'',...env},encoding:'utf8'}).trim();
test('single public root client ID becomes backend audience without a client secret',()=>assert.equal(run({VITE_GOOGLE_CLIENT_ID:'public-test.apps.googleusercontent.com'}),'true'));
test('conflicting public and backend audience configuration fails closed',()=>{
 const r=spawnSync(process.execPath,['--input-type=module','-e',`await import('./backend/src/config/env.js')`],{cwd:new URL('..',import.meta.url),env:{...process.env,VITE_GOOGLE_CLIENT_ID:'public-test.apps.googleusercontent.com',GOOGLE_CLIENT_ID:'different'},encoding:'utf8'});assert.notEqual(r.status,0);
});
test('Compose maps the same public ID to backend and frontend and has no secret requirement',()=>{
 const compose=readFileSync(new URL('../docker-compose.yml',import.meta.url),'utf8');
 assert.match(compose,/GOOGLE_CLIENT_ID: \$\{VITE_GOOGLE_CLIENT_ID:-\}/);assert.match(compose,/VITE_GOOGLE_CLIENT_ID: \$\{VITE_GOOGLE_CLIENT_ID:-\}/);assert.ok(!compose.includes('GOOGLE_CLIENT_SECRET'));
});
