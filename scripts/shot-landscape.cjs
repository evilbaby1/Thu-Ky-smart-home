const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  // Landscape phone-ish + desktop
  for (const [name, w, h] of [
    ['land-phone', 960, 400],
    ['land-wide', 1280, 720],
  ]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:5173/?v=' + Date.now(), { waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);
    const out = path.join(__dirname, '..', 'output', 'playwright');
    await p.screenshot({ path: path.join(out, `${name}-vanien.png`) });
    await p.click('.tab[data-tab="devices"]');
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, `${name}-devices.png`) });
    const info = await p.evaluate(() => {
      const main = document.querySelector('.main');
      const stage = document.querySelector('.stage');
      return {
        mainW: main?.getBoundingClientRect().width,
        stageW: stage?.getBoundingClientRect().width,
        bodyW: window.innerWidth,
        cols: getComputedStyle(main).gridTemplateColumns,
      };
    });
    console.log(name, JSON.stringify(info));
    await p.close();
  }
  await b.close();
  console.log('OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
