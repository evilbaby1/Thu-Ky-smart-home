const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:4173/?v=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const st = await p.evaluate(() => ({
    h3: [...document.querySelectorAll('.stage-content h3')].map((x) => x.textContent),
    hasHours: !!document.querySelector('.hours-card'),
    quote: document.querySelector('.quote-text')?.textContent,
    fortuneTitle: document.querySelector('.fortune-compact-title')?.textContent,
    detailRows: [...document.querySelectorAll('.card:not(.fortune-compact):not(.hours-card):not(.quote-card) .kv .k')].map(
      (x) => x.textContent,
    ),
  }));
  console.log(JSON.stringify(st, null, 2));
  await p.screenshot({ path: path.join(__dirname, '..', 'output', 'playwright', 'van-nien-v2.png') });
  await b.close();
  console.log('OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
