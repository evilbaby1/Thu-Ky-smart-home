const { chromium } = require('playwright-core');

const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyODFkZjg4ODEzOTI0YjhkOGExMDE0OGEwYmRkZGQ3YyIsImlhdCI6MTc5MTEyMTU1NSwiZXhwIjoyMTA2NDgxNTU1fQ.mqyKBsEDnTUAY7upY9U7PFBZZoSD-5y_nl1i1UQF3jc';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Inject settings like the app would
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
  await page.waitForTimeout(1500);

  // Open settings and click Test
  await page.click('#btn-settings');
  await page.waitForTimeout(300);
  await page.fill('#cfg-ha-url', 'http://192.168.1.13');
  await page.fill('#cfg-ha-token', TOKEN);
  await page.click('#btn-test-ha');
  await page.waitForTimeout(1500);
  const testMsg = await page.textContent('#settings-msg');
  await page.click('#btn-close-settings');
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => ({
    ha: document.getElementById('ha-status')?.dataset.state,
    label: document.getElementById('ha-status')?.textContent?.trim(),
    tiles: document.querySelectorAll('.device-tile').length,
    chips: [...document.querySelectorAll('.room-chip')].map((c) => c.textContent?.trim()),
    voice: document.getElementById('voice-status')?.textContent,
  }));

  console.log(JSON.stringify({ testMsg, state }, null, 2));
  await page.screenshot({ path: 'output/playwright/ha-connected.png' });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
