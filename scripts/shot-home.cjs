const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://localhost:5173/?v=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const t = Date.now();
  const out = path.join(__dirname, '..', 'output', 'playwright');
  await p.screenshot({ path: path.join(out, `home-no-devices-${t}.png`) });
  const info = await p.evaluate(() => ({
    tabs: [...document.querySelectorAll('.tab')].map((x) => x.textContent),
    railHidden: document.getElementById('device-rail')?.hasAttribute('hidden'),
    tiles: document.querySelectorAll('.device-tile').length,
    quote: document.querySelector('.quote-text')?.textContent,
  }));
  console.log('HOME', JSON.stringify(info));
  await p.click('.tab[data-tab="devices"]');
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, `devices-tab-${t}.png`) });
  console.log('files', `home-no-devices-${t}.png`, `devices-tab-${t}.png`);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
