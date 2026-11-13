import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('agent6 integration: all five Wave 2 APIs mount under the real Express app',()=>{
 const app=source('../../src/app.js');const routes=source('../../src/routes/wave2.js');
 assert.match(app,/app\.use\("\/api\/wave2",\s*wave2\)/);
 for(const endpoint of ['/stylist','/outfits','/chat','/visual-search','/recommendations'])assert.ok(routes.includes(`'${endpoint}'`));
});
test('agent6 integration: private personal data endpoints require authentication',()=>{
 const routes=source('../../src/routes/wave2.js');
 for(const endpoint of ['/chat','/visual-search','/recommendations','/conversations'])assert.match(routes,new RegExp(`router\\.(?:get|post)\\('${endpoint}',requireAuth`));
});
test('agent6 TDD safety: staging launcher refuses absent or wrong database URI',()=>{
 const file=new URL('../../../scripts/launchWave2Staging.mjs',import.meta.url);
 for(const staging of ['', 'mongodb+srv://u:p@example.com/real_gazu_store?retryWrites=true']){
  const result=spawnSync(process.execPath,[file.pathname],{env:{...process.env,MONGODB_STAGING_URI:staging,MONGODB_URI:'mongodb+srv://u:p@example.com/test'},encoding:'utf8',timeout:5000});
  assert.equal(result.status,1);assert.match(result.stderr,/SAFETY STOP/);
 }
});
test('agent6 integration: storefront routes render all five Phase 5–9 entry points',()=>{
 const app=source('../../../frontend/src/App.jsx');
 for(const path of ['/style-finder','/shop-the-look','/ai-assistant','/visual-search','/discover'])assert.ok(app.includes(`path="${path}"`));
});
