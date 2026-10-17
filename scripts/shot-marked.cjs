const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:4173/?v=' + Date.now(), { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  // Paint a unique color strip into the DOM so we know the screenshot is this run
  await p.evaluate(() => {
    const mark = document.createElement('div');
    mark.id = 'shot-marker';
    mark.style.cssText =
      'position:fixed;top:0;left:0;width:12px;height:12px;background:#ff00aa;z-index:9999';
    document.body.appendChild(mark);
    const t = document.createElement('div');
    t.style.cssText =
      'position:fixed;top:0;right:0;background:#00ff88;color:#000;font:12px monospace;z-index:9999;padding:2px 6px';
    t.textContent = 'RUN ' + Date.now();
    document.body.appendChild(t);
  });

  const stamp = Date.now();
  const file = path.join(__dirname, '..', 'output', 'playwright', `grid-${stamp}.png`);
  const el = await p.$('.stage-content');
  if (el) await el.screenshot({ path: file });
  else await p.screenshot({ path: file });

  const st = await p.evaluate(() => {
    const q = document.querySelector('.quote-text');
    const f = document.querySelector('.fortune-compact-title');
    const h = document.querySelector('.hours-card h3');
    return {
      quote: q?.textContent,
      fortune: f?.textContent,
      hours: h?.textContent,
      quoteCardHTML: document.querySelector('.quote-card')?.innerHTML?.slice(0, 120),
    };
  });
  const buf = fs.readFileSync(file);
  console.log(
    JSON.stringify(
      {
        file,
        bytes: buf.length,
        sha1: crypto.createHash('sha1').update(buf).digest('hex'),
        st,
      },
      null,
      2,
    ),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
