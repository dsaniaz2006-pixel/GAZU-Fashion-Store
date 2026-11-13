import {test,expect} from '@playwright/test';
// Requires running GAZU frontend+backend and a test database. Never run on production.
test('Wave 1: smart shop search accepts natural language and preserves category',async({page})=>{
 await page.goto('/shop');
 const search=page.getByRole('textbox',{name:/search products/i});
 await expect(search).toBeVisible();
 await search.fill('black oversized streetwear under 3000');
 await expect(search).toHaveValue('black oversized streetwear under 3000');
 await expect(page).toHaveURL(/q=black/);
 await expect(page.getByRole('combobox',{name:/category/i})).toBeVisible();
 await expect(page.getByRole('button',{name:/grid view/i})).toBeVisible();
});
test('Wave 1: unauthenticated users cannot access AI admin workflows',async({request})=>{
 const r=await request.get('http://localhost:8000/api/ai/drafts');expect(r.status()).toBe(401);
 const s=await request.post('http://localhost:8000/api/ai/chat',{data:{message:'Suggest a tee'}});expect(s.status()).toBe(401);
});
