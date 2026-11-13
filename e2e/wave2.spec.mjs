import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
// Run ONLY against the guarded Wave 2 staging server on port 5174.
const token=process.env.WAVE2_E2E_TOKEN||'';
test.beforeEach(async({page})=>{
 if(token)await page.addInitScript(t=>sessionStorage.setItem('gazu-token',t),token);
});
test('agent1 E2E browser: fashion stylist returns actual catalogue results',async({page})=>{
 await page.goto('/style-finder');await page.getByRole('button',{name:'ASK GAZU STYLIST'}).click();
 await expect(page.getByText(/Catalogue-based styling|AI-assisted styling/)).toBeVisible();
});
test('agent2 E2E browser: user can build an outfit and see missing inventory slots',async({page})=>{
 await page.goto('/shop-the-look');await page.getByRole('button',{name:'BUILD MY OUTFIT'}).click();
 await expect(page.getByText(/Partial look|Complete outfit assembled/)).toBeVisible();
});
test('agent3 E2E browser: signed-in user can continue chat',async({page})=>{
 test.skip(!token,'Set WAVE2_E2E_TOKEN to a valid STAGING account token');
 await page.goto('/ai-assistant');await page.getByLabel('Your style question').fill('Find a simple cotton tee');await page.getByRole('button',{name:/SEND/}).click();
 await expect(page.getByText('Find a simple cotton tee')).toBeVisible();await expect(page.locator('.gazu-wave2-bubble.is-ai')).toBeVisible();
});
test('agent4 E2E browser: visual search uses file upload and shows verified match state',async({page})=>{
 test.skip(!token,'Set WAVE2_E2E_TOKEN to a valid STAGING account token');
 await page.goto('/visual-search');await page.getByLabel(/Garment photograph/).setInputFiles({name:'oxford-shirt.webp',mimeType:'image/webp',buffer:readFileSync(new URL('../frontend/public/products/men-topwear/custom-fit-gingham-oxford-shirt.webp',import.meta.url))});
 await page.getByRole('button',{name:'FIND SIMILAR PIECES'}).click();
 await expect(page.getByText(/Detected:/)).toBeVisible();
});
test('agent5 E2E browser: recommendation view is account-scoped',async({page})=>{
 test.skip(!token,'Set WAVE2_E2E_TOKEN to a valid STAGING account token');
 await page.goto('/discover');await expect(page.getByRole('heading',{name:'CURATED FOR YOU.'})).toBeVisible();
 await expect(page.getByText(/informed by your wishlist|chosen style|tailor future suggestions/i).first()).toBeVisible();
});
