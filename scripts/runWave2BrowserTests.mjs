import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let binary;try{binary=require.resolve('@playwright/test/cli.js');}catch{console.error('Playwright is not installed. On your Mac, run: npm install -D @playwright/test && npx playwright install chromium');process.exit(1);}
if(process.env.WAVE2_E2E_BASE_URL!=='http://localhost:5174'){console.error('Start npm run wave2:staging, then set WAVE2_E2E_BASE_URL=http://localhost:5174');process.exit(1);}
const result=spawnSync(process.execPath,[binary,'test','--config=e2e/playwright.config.mjs'],{stdio:'inherit',env:process.env});process.exit(result.status??1);
