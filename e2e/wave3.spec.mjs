// Browser E2E for each workstream. Stubbed API data avoids production/staging writes.
import {test,expect} from '@playwright/test';
const productId='507f1f77bcf86cd799439093';
const respond=(body,status=200)=>({status,headers:{'content-type':'application/json','x-gazu-api':'gazu-store'},body:JSON.stringify(body)});
async function signedIn(page,role='customer'){
 await page.addInitScript(()=>sessionStorage.setItem('gazu-token','wave3-browser-test-only'));
 await page.route('**/api/auth/me',route=>route.fulfill(respond({user:{id:'u1',name:'Test Customer',role,emailVerified:true}})));
}
test('agent1 browser E2E: verified fit result and non-guarantee visible',async({page})=>{
 await page.route('**/api/wave3/fit/products',route=>route.fulfill(respond({items:[{id:productId,name:'Verified Tee',category:'Men',hasVerifiedChart:true}]})));
 await page.route('**/api/wave3/fit/recommend',route=>route.fulfill(respond({product:{id:productId,name:'Verified Tee'},recommendedSize:'M',confidence:'moderate',explanation:'Verified body chart suggests M; this is not a guarantee.'})));
 await page.goto('/fit-assistant');await page.getByLabel('Chest (cm)').fill('98');await page.getByRole('button',{name:'CHECK VERIFIED FIT'}).click();await expect(page.getByText('Verified body chart suggests M; this is not a guarantee.')).toBeVisible();
});
test('agent2 browser E2E: own order support opens a human escalation',async({page})=>{
 await signedIn(page);
 await page.route('**/api/wave3/support/orders',route=>route.fulfill(respond({items:[]})));
 await page.route('**/api/wave3/support/tickets',route=>route.fulfill(respond(route.request().method()==='POST'?{id:productId,status:'open',category:'return'}:{items:[]},route.request().method()==='POST'?201:200)));
 await page.route('**/api/wave3/support/ask',route=>route.fulfill(respond({category:'return',answer:'Human review required for return eligibility.',needsHuman:true,disclaimer:'No refund or return was approved.'})));

 await page.goto('/support');await page.getByPlaceholder(/Where is my order/i).fill('I want to return the damaged item');await page.getByRole('button',{name:'ASK ABOUT MY ORDER'}).click();await expect(page.getByText('Human review required for return eligibility.')).toBeVisible();
});
test('agent3 browser E2E: multilingual shopping and typed fallback are accessible',async({page})=>{
 await signedIn(page);
 await page.route('**/api/wave2/conversations',route=>route.fulfill(respond({items:[]})));
 await page.goto('/ai-assistant');await page.getByLabel('Response language').selectOption('pa');await expect(page.getByRole('button',{name:'VOICE QUESTION'})).toBeVisible();await page.getByLabel('Your style question').fill('ਮੈਨੂੰ ਕਮੀਜ਼ ਚਾਹੀਦੀ');await expect(page.getByRole('button',{name:/SEND/})).toBeEnabled();
});
test('agent4 browser E2E: staff review is explicit, never automatic',async({page})=>{
 await signedIn(page,'admin');
 await page.route('**/api/wave3/admin/audit',route=>route.fulfill(respond({productCount:1,findings:[],reviewSentiment:{positive:0,negative:0,neutral:0}})));
 await page.route('**/api/wave3/admin/suggestions',route=>route.fulfill(respond({items:[{_id:productId,status:'pending',product:{name:'Verified Tee'},suggestedFields:{description:'A classic cotton tee.'}}]})));
 await page.route('**/api/admin/products',route=>route.fulfill(respond([{_id:productId,name:'Verified Tee'}])));
 await page.goto('/admin/ai-studio');await expect(page.getByRole('button',{name:'APPROVE'})).toBeVisible();await expect(page.getByRole('button',{name:'REJECT'})).toBeVisible();
});
test('agent5 browser E2E: forecast reports insufficient data without action',async({page})=>{
 await signedIn(page,'admin');await page.route('**/api/wave3/admin/forecast*',route=>route.fulfill(respond({days:56,horizonDays:7,items:[{productId,name:'Verified Tee',category:'Men',forecast:{reliability:'insufficient',forecastUnits:null},inventory:{stock:4,risk:'low',suggestion:'Monitor inventory',sizeNotes:[]}}],disclaimer:'Read only.'})));
 await page.goto('/admin/inventory-forecast');await expect(page.getByText('INSUFFICIENT DATA')).toBeVisible();await expect(page.getByText(/No action taken/)).toBeVisible();
});
