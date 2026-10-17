const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  // Try common Chromium/Chrome/Edge paths on Windows
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);

  const fs = require('fs');
  const executablePath = candidates.find((p) => p && fs.existsSync(p));
  if (!executablePath) {
    console.log('NO_BROWSER');
    process.exit(2);
  }
  console.log('BROWSER', executablePath);

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--window-size=1280,720', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE', m.text());
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'playwright', 'home-landscape.png'), fullPage: false });

  // Switch tabs
  for (const tab of ['weather', 'tides', 'fortune', 'lunar']) {
    await page.click(`.tab[data-tab="${tab}"]`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(__dirname, '..', 'output', 'playwright', `tab-${tab}.png`) });
  }

  // Open settings
  await page.click('#btn-settings');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, '..', 'output', 'playwright', 'settings.png') });

  const title = await page.title();
  const clock = await page.textContent('#clock-time');
  const lunar = await page.textContent('#stage-content');
  console.log('TITLE', title);
  console.log('CLOCK', clock);
  console.log('LUNAR_SNIP', (lunar || '').slice(0, 200));
  await browser.close();
  console.log('OK');
})().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
