const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyODFkZjg4ODEzOTI0YjhkOGExMDE0OGEwYmRkZGQ3YyIsImlhdCI6MTc5MTEyMTU1NSwiZXhwIjoyMTA2NDgxNTU1fQ.mqyKBsEDnTUAY7upY9U7PFBZZoSD-5y_nl1i1UQF3jc';

function stripVi(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd');
}

const ROOM_PATTERNS = [
  [/phong[_ ]?(be[_ ]?xiu|be xiu)|be[_ ]?xiu/, 'Phòng bé xíu'],
  [/phong[_ ]?(bi[_ ]?bo|bi bo)|bi[_ ]?bo/, 'Phòng bi bo'],
  [/phong[_ ]?master|[^a-z]master[^a-z]|wc[_ ]?master/, 'Phòng master'],
  [/phong[_ ]?khach|[^a-z]khach[^a-z]|living/, 'Phòng khách'],
  [/wc[_ ]?chung|phong[_ ]?tam|nha[_ ]?tam|ve[_ ]?sinh|[^a-z]wc[^a-z]|bath|tolet|toi[_ ]?let/, 'Nhà tắm'],
  [/bep|kitchen/, 'Bếp'],
  [/rem_|curtain/, 'Rèm cửa'],
];

function inferRoom(friendly, entityId) {
  const hay = stripVi(`${friendly} ${entityId.replace(/[._]/g, ' ')}`);
  for (const [re, label] of ROOM_PATTERNS) {
    if (re.test(hay)) return label;
  }
  return 'Khác';
}

(async () => {
  const res = await fetch('http://192.168.1.13/api/states', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const states = await res.json();
  const controllable = states.filter((e) =>
    ['light', 'switch', 'fan', 'climate', 'cover', 'media_player'].includes(e.entity_id.split('.')[0]),
  );
  const byRoom = new Map();
  for (const e of controllable) {
    const room = inferRoom(e.attributes.friendly_name || e.entity_id, e.entity_id);
    if (!byRoom.has(room)) byRoom.set(room, []);
    byRoom.get(room).push(`${e.entity_id} | ${e.attributes.friendly_name}`);
  }
  console.log('Total controllable:', controllable.length);
  for (const [room, list] of [...byRoom.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${room} (${list.length})`);
    list.slice(0, 5).forEach((x) => console.log('  ', x));
    if (list.length > 5) console.log('   ...');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
