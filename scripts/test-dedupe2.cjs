// mirror of mergeDuplicateSwitches + dedupeShortNames for a quick check
function stripVi(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
const SWITCH_DUPLICATED_BY = new Set(['light', 'fan', 'climate', 'cover', 'media_player', 'humidifier', 'vacuum']);
const DOMAIN_LABEL = { light: 'đèn', switch: 'công tắc', fan: 'quạt', climate: 'máy lạnh', cover: 'rèm', media_player: 'loa' };

function normLabel(s) {
  return stripVi(s).replace(/[^a-z0-9]+/g, ' ').trim();
}

function mergeDuplicateSwitches(entities) {
  const groups = new Map();
  for (const e of entities) {
    const key = e.room + '||' + normLabel(e.friendly_name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const drop = new Set();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const primary = group.find((e) => SWITCH_DUPLICATED_BY.has(e.domain));
    if (!primary) continue;
    for (const e of group) {
      if (e.domain === 'switch' && e.entity_id !== primary.entity_id) {
        drop.add(e.entity_id);
        if (e.isOn && !primary.isOn) { primary.isOn = true; primary.state = e.state; }
      }
    }
  }
  return entities.filter((e) => !drop.has(e.entity_id));
}

function dedupeShortNames(entities) {
  const byKey = new Map();
  for (const e of entities) {
    const key = e.room + '||' + e.shortName.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(e);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const used = new Set();
    for (const e of group) {
      const label = DOMAIN_LABEL[e.domain] || e.domain;
      let name = e.shortName + ' (' + label + ')';
      if (used.has(name.toLowerCase())) {
        const tail = e.entity_id.split('.').pop() || '';
        name = e.shortName + ' · ' + tail.replace(/_/g, ' ').slice(0, 18);
      }
      used.add(name.toLowerCase());
      e.shortName = name;
    }
    const seen = new Map();
    for (const e of group) {
      const k = e.shortName.toLowerCase();
      const n = (seen.get(k) || 0) + 1;
      seen.set(k, n);
      if (n > 1) e.shortName = e.shortName + ' ' + n;
    }
  }
  return entities;
}

const mk = (id, name, room, on = false) => ({
  entity_id: id,
  friendly_name: name,
  room,
  domain: id.split('.')[0],
  isOn: on,
  state: on ? 'on' : 'off',
  shortName: name,
});

const list = [
  mk('switch.den_ban_an', 'Đèn bàn ăn', 'Phòng khách'),
  mk('light.den_ban_an', 'Đèn bàn ăn', 'Phòng khách'),
  mk('switch.den_bep', 'Đèn bếp', 'Phòng khách', true),
  mk('light.den_bep', 'Đèn bếp', 'Phòng khách'),
  mk('switch.quat', 'Quạt', 'Phòng khách'),
  mk('fan.quat', 'Quạt', 'Phòng khách'),
  mk('light.den_led', 'Đèn led', 'Phòng khách'), // single, stays
  mk('switch.tu_lanh', 'Tủ lạnh', 'Bếp'), // switch only, stays
];

console.log('KẾT QUẢ sau khi gộp + đặt tên:');
for (const e of dedupeShortNames(mergeDuplicateSwitches(list))) {
  console.log(' -', e.entity_id.padEnd(24), '=>', e.shortName.padEnd(16), '| on:', e.isOn, '| room:', e.room);
}
