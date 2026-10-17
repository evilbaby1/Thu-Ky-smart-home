const { chromium } = require('playwright-core');
const path = require('path');

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyODFkZjg4ODEzOTI0YjhkOGExMDE0OGEwYmRkZGQ3YyIsImlhdCI6MTc5MTEyMTU1NSwiZXhwIjoyMTA2NDgxNTU1fQ.mqyKBsEDnTUAY7upY9U7PFBZZoSD-5y_nl1i1UQF3jc';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(
    ([token]) => {
      localStorage.setItem(
        'thuky.settings',
        JSON.stringify({
          haUrl: 'http://192.168.1.13',
          haToken: token,
          wakePhrase: 'Thư Ký ơi',
          voiceReply: true,
          ownerName: 'anh',
        }),
      );
    },
    [TOKEN],
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const out = path.join(__dirname, '..', 'output', 'playwright');
  await page.screenshot({ path: path.join(out, 'tab-thiet-bi.png') });

  const info = await page.evaluate(() => ({
    tabs: [...document.querySelectorAll('.tab')].map((t) => t.textContent?.trim()),
    chips: [...document.querySelectorAll('.room-chip')].map((c) => c.textContent?.trim()),
    chipsVisible: [...document.querySelectorAll('.room-chip')].filter((c) => c.offsetParent).length,
    tiles: document.querySelectorAll('.device-tile').length,
    stageHtml: document.getElementById('stage-content')?.innerHTML?.slice(0, 300),
    ha: document.getElementById('ha-status')?.dataset.state,
  }));
  console.log('AFTER LOAD', JSON.stringify(info, null, 2));

  const chip = page.locator('.room-chips-lg .room-chip').nth(1);
  if (await chip.count()) {
    await chip.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, 'tab-thiet-bi-room.png') });
  }

  await page.click('.tab[data-tab="lunar"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'tab-van-nien-quote.png') });

  const info2 = await page.evaluate(() => {
    const quote = document.querySelector('.quote-card');
    const qr = quote?.getBoundingClientRect();
    return {
      quoteText: document.querySelector('.quote-text')?.textContent,
      quoteTop: qr?.top,
      quoteBottom: qr?.bottom,
      innerH: window.innerHeight,
      quoteOnScreen: !!quote && qr.top < window.innerHeight && qr.bottom > 40,
    };
  });
  console.log('LUNAR', JSON.stringify(info2, null, 2));
  await browser.close();
  console.log('OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
