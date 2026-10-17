import { getLunarDate, canChiYear, canChiDay } from '../src/lunar.ts';

const cases = [
  { label: 'Tet 2024-02-10', d: new Date(2024, 1, 10), expect: { y: 2024, m: 1, d: 1 } },
  { label: 'Tet 2025-01-29', d: new Date(2025, 0, 29), expect: { y: 2025, m: 1, d: 1 } },
  { label: '2025-08-23', d: new Date(2025, 7, 23), expect: { y: 2025, m: 7, d: 1 } },
  { label: 'today', d: new Date() },
];

for (const c of cases) {
  const l = getLunarDate(c.d);
  console.log(c.label, '=>', l.lunarDay, '/', l.lunarMonth, 'year', l.lunarYear, l.isLeap ? '(leap)' : '', l.canChiDay, l.canChiYear);
  if (c.expect) {
    const ok = l.lunarYear === c.expect.y && l.lunarMonth === c.expect.m && l.lunarDay === c.expect.d;
    console.log('  expected', c.expect, ok ? 'OK' : 'FAIL');
  }
}
console.log('canChiYear 2024', canChiYear(2024), 'canChiDay 2000-01-01', canChiDay(new Date(2000, 0, 1)));
