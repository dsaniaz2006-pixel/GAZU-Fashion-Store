import{test,expect}from'@playwright/test';
test('storefront, style quiz and launches routes render',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/GAZU/i);await page.goto('/style-finder');await expect(page.getByRole('heading',{name:/find your style/i})).toBeVisible();await page.goto('/launches');await expect(page.getByRole('heading',{name:/collection launches/i})).toBeVisible()});
test('style quiz changes preferred style',async({page})=>{await page.goto('/style-finder');const style=page.getByLabel('My style');await style.selectOption('street');await expect(style).toHaveValue('street')});
test('account-protected profile redirects guests to signin',async({page})=>{await page.goto('/account/profile');await expect(page).toHaveURL(/\/account/)});
