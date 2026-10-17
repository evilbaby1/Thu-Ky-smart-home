// inline minimal copy of dedupe for a quick check
const DOMAIN_LABEL = {
  light: 'đèn',
  switch: 'công tắc',
  fan: 'quạt',
  climate: 'máy lạnh',
  cover: 'rèm',
  media_player: 'loa',
};

function dedupe(entities) {
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

const list = [
  { entity_id: 'light.phong_khach_khach_ct_phai_switch_1', shortName: 'Đèn bếp', room: 'Phòng khách', domain: 'light' },
  { entity_id: 'switch.phong_khach_khach_ct_phai_switch_1', shortName: 'Đèn bếp', room: 'Phòng khách', domain: 'switch' },
  { entity_id: 'light.a', shortName: 'Đèn bàn ăn', room: 'Phòng khách', domain: 'light' },
  { entity_id: 'switch.b', shortName: 'Đèn bàn ăn', room: 'Phòng khách', domain: 'switch' },
  { entity_id: 'light.c', shortName: 'Đèn bàn ăn', room: 'Phòng khách', domain: 'light' },
];

for (const e of dedupe(list)) console.log(e.entity_id, '=>', e.shortName);
