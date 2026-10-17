const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Hard bypass: unique query + no cache
  const url = 'http://127.0.0.1:4173/?t=' + Date.now();
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.resourceType() === 'document' || req.resourceType() === 'script' || req.resourceType() === 'stylesheet') {
      route.continue({ headers: { ...req.headers(), 'Cache-Control': 'no-cache' } });
    } else {
      route.continue();
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  });
  await page.goto('http://127.0.0.1:4173/?fresh=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.stage-content .card h3')].map((h) => h.textContent);
    const classes = [...document.querySelectorAll('.stage-content .card')].map((c) => c.className);
    return {
      cards,
      classes,
      quote: document.querySelector('.quote-text')?.textContent,
      hours: !!document.querySelector('.hours-card'),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  const out = path.join(__dirname, '..', 'output', 'playwright');
  await page.screenshot({ path: path.join(out, 'van-nien-full.png') });
  await page.click('.quote-next').catch(() => {});
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, 'van-nien-quote2.png') });

  await browser.close();
  console.log('OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
