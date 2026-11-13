import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const fromRoot=createRequire(import.meta.url);
const fromE2E=createRequire(new URL('../e2e/package.json',import.meta.url));
let binary;
for(const req of [fromE2E,fromRoot]){try{binary=req.resolve('@playwright/test/cli.js');break}catch{}}
if(!binary){console.error('Playwright is not installed. Run: npm install --prefix e2e && npx --prefix e2e playwright install chromium');process.exit(1)}
if(process.env.WAVE3_E2E_BASE_URL!=='http://localhost:5174'){
 console.error('E2E safety stop: only use the Wave 3 staging frontend. Set WAVE3_E2E_BASE_URL=http://localhost:5174');process.exit(1);
}
const result=spawnSync(process.execPath,[binary,'test','--config=e2e/wave3.config.mjs'],{stdio:'inherit',env:process.env});
process.exit(result.status??1);
