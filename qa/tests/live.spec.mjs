import {test,expect} from '@playwright/test';

test.skip(!process.env.QA_BASE_URL,'production smoke runs after deploy');
test.setTimeout(60000);

async function waitForLive(page,path,selector){
  await expect.poll(async()=>{
    try{
      const join=path.includes('?')?'&':'?';
      const response=await page.goto(path+join+'qa='+Date.now(),{waitUntil:'domcontentloaded',timeout:12000});
      return !!response && response.status()===200 && await page.locator(selector).count()>0;
    }catch{return false}
  },{timeout:35000,intervals:[1000,1500,2500,4000]}).toBe(true)
}

test('live customer catalog loads current runtime @live',async({page})=>{
  await waitForLive(page,'catalog/','#catalogTitle');
  await expect.poll(()=>page.locator('#grid .card').count(),{timeout:15000}).toBeGreaterThan(0);
  await expect(page.locator('script[src*="catalog-pro-v8.js"]')).toHaveCount(1)
});

test('live product route loads published product @live',async({page})=>{
  await waitForLive(page,'catalog/product.html?code=2233','h1.title');
  await expect(page.locator('#order')).toBeVisible();
  await expect(page.locator('script[src*="product-pro-v7.js"]')).toHaveCount(1)
});

test('live admin login shell and QA runtime load @live',async({page})=>{
  await waitForLive(page,'admin-v2.html','#loginForm');
  await expect(page.locator('script[src*="admin-ui-v3.js"]')).toHaveCount(1)
});
