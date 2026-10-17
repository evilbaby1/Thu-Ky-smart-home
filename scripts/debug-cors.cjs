const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const p = await b.newPage();
  p.on('console', (m) => console.log('CON', m.type(), m.text()));
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const r = await p.evaluate(async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyODFkZjg4ODEzOTI0YjhkOGExMDE0OGEwYmRkZGQ3YyIsImlhdCI6MTc5MTEyMTU1NSwiZXhwIjoyMTA2NDgxNTU1fQ.mqyKBsEDnTUAY7upY9U7PFBZZoSD-5y_nl1i1UQF3jc';
    try {
      const res = await fetch('http://192.168.1.13/api/states', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        acao: res.headers.get('access-control-allow-origin'),
        textLen: text.length,
        textHead: text.slice(0, 80),
      };
    } catch (e) {
      return { err: String(e), stack: e && e.stack };
    }
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
