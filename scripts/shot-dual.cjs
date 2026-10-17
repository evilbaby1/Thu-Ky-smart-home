const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const out = 'F:\\AIsource\\AppsmartHome\\output\\playwright';
  // Portrait: phone dọc
  {
    const p = await browser.newPage({ viewport: { width: 410, height: 860 } });
    p.on('pageerror', (e) => console.log('PORTRAIT PAGEERROR', e.message));
    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2200);
    await p.evaluate(() => localStorage.setItem('thuky.layout', 'portrait'));
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(out, 'new-portrait-lunar.png') });
    await p.click('.tab[data-tab="devices"]');
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(out, 'new-portrait-devices.png') });
    const info = await p.evaluate(() => ({
      tabs: document.querySelectorAll('.tab').length,
      tiles: document.querySelectorAll('.device-tile').length,
      layout: document.body.dataset.layout,
      cls: document.body.className,
    }));
    console.log('PORTRAIT', JSON.stringify(info));
    await p.close();
  }
  // Landscape: panel ngang
  {
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', (e) => console.log('LAND PAGEERROR', e.message));
    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2200);
    await p.evaluate(() => localStorage.setItem('thuky.layout', 'landscape'));
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(out, 'new-landscape-lunar.png') });
    await p.click('.tab[data-tab="devices"]');
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(out, 'new-landscape-devices.png') });
    const info = await p.evaluate(() => ({
      tabs: document.querySelectorAll('.tab').length,
      tiles: document.querySelectorAll('.device-tile').length,
      layout: document.body.dataset.layout,
      stageDisplay: getComputedStyle(document.querySelector('.device-stage')).display,
      roomTabsDir: getComputedStyle(document.querySelector('.room-tabs')).flexDirection,
    }));
    console.log('LANDSCAPE', JSON.stringify(info));
    await p.close();
  }
  await browser.close();
  console.log('OK');
})().catch((e) => { console.error(e); process.exit(1); });
