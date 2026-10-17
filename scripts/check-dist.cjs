const fs = require('fs');
const files = fs.readdirSync('dist/assets').filter((x) => x.endsWith('.js'));
for (const x of files) {
  const s = fs.readFileSync('dist/assets/' + x, 'utf8');
  console.log(x, {
    hoursCard: s.includes('hours-card'),
    vanNien: s.includes('van-nien-grid'),
    quoteNext: s.includes('Câu khác'),
    oldGioTotInFortune: s.includes('Giờ tốt') && s.includes('fortune-compact-kv'),
  });
}
