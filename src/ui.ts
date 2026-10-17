import type { HaEntity, WeatherDay, WeatherNow, LunarDate } from './types';
import type { TideEvent } from './types';
import { weekdayVi, formatSolarVi } from './lunar';
import type { FortuneReading } from './fortune';
import type { FolkQuote } from './quotes';
import { formatHourVi, tidePoints } from './tides';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const DOMAIN_ICON: Record<string, string> = {
  light: '💡',
  switch: '🔌',
  fan: '🌀',
  climate: '❄️',
  cover: '🪟',
  media_player: '🔊',
  humidifier: '💧',
  vacuum: '🤖',
  input_boolean: '⚙️',
  sensor: '🌡️',
  binary_sensor: '📡',
  button: '🔘',
};

const ROOM_ICON: Record<string, string> = {
  'Phòng khách': '🛋️',
  'Phòng master': '🛏️',
  'Phòng bé xíu': '🧒',
  'Phòng bi bo': '👶',
  'Phòng ngủ': '🛏️',
  'Phòng làm việc': '💼',
  'Phòng trẻ em': '🧸',
  Bếp: '🍳',
  'Nhà tắm': '🚿',
  'Hành lang': '🚪',
  'Rèm cửa': '🪟',
  'Ban công': '🌿',
  Garage: '🚗',
  'Hồ bơi': '🏊',
  Khác: '📦',
};

export function renderRoomChips(
  container: HTMLElement,
  rooms: string[],
  selected: string,
  counts: Record<string, number>,
  onSelect: (room: string) => void,
) {
  container.innerHTML = '';
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const items: Array<[string, string, number]> = [['Tất cả', '🏠', total], ...rooms.map((r) => [r, ROOM_ICON[r] ?? '📦', counts[r] ?? 0] as [string, string, number])];
  for (const [id, icon, count] of items) {
    const btn = el('button', `room-chip${id === selected ? ' active' : ''}`);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', id === selected ? 'true' : 'false');
    btn.innerHTML = `<span class="room-chip-icon">${icon}</span><span>${id}</span><span class="room-chip-count">${count}</span>`;
    btn.addEventListener('click', () => onSelect(id));
    container.appendChild(btn);
  }
}

function buildDeviceTile(e: HaEntity, onToggle: (e: HaEntity) => void, large = false) {
  const tile = el('div', `device-tile${large ? ' device-tile-lg' : ''}${e.isOn ? ' is-on' : ''}`);
  const climate =
    e.domain === 'climate' && e.attributes.temperature != null
      ? ` · ${String(e.attributes.temperature)}°`
      : '';
  const status = e.isOn ? 'Đang bật' : 'Đang tắt';
  tile.setAttribute('role', 'switch');
  tile.setAttribute('aria-checked', e.isOn ? 'true' : 'false');
  tile.setAttribute('title', `${e.friendly_name} — ${status}`);
  tile.innerHTML = `
    <div class="device-tile-icon">${DOMAIN_ICON[e.domain] ?? '✨'}</div>
    <div class="device-tile-text">
      <div class="device-name">${e.shortName}</div>
      <div class="device-meta">${status}${climate} · ${e.room}</div>
    </div>`;
  const toggle = el('button', `device-toggle${e.isOn ? ' on' : ''}`);
  toggle.setAttribute('aria-label', `Bật tắt ${e.friendly_name}`);
  toggle.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onToggle(e);
  });
  tile.appendChild(toggle);
  tile.addEventListener('click', () => onToggle(e));
  return tile;
}

export function renderDevices(
  container: HTMLElement,
  entities: HaEntity[],
  selectedRoom: string,
  roomsOrder: string[],
  onToggle: (e: HaEntity) => void,
  options: { large?: boolean } = {},
) {
  container.innerHTML = '';
  const list = entities.filter(
    (e) => e.isControllable && (selectedRoom === 'Tất cả' || e.room === selectedRoom),
  );
  if (!list.length) {
    const empty = el('div', 'empty-hint');
    empty.innerHTML = `🏡<br>Chưa có thiết bị trong phòng này<br><small>Hãy thêm thiết bị trong Home Assistant</small>`;
    container.appendChild(empty);
    return;
  }

  const groups = new Map<string, HaEntity[]>();
  for (const e of list) {
    const key = selectedRoom === 'Tất cả' ? e.room : selectedRoom;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const ordered = [...groups.keys()].sort((a, b) => {
    const ia = roomsOrder.indexOf(a);
    const ib = roomsOrder.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'vi');
  });

  for (const room of ordered) {
    const items = groups.get(room)!;
    if (selectedRoom === 'Tất cả') {
      const head = el('div', 'room-group-head');
      head.innerHTML = `<span>${ROOM_ICON[room] ?? '📦'}</span><span>${room}</span><span class="room-group-count">${items.length}</span>`;
      container.appendChild(head);
    }
    const grid = el('div', `device-grid${options.large ? ' device-grid-lg' : ''}`);
    for (const e of items) {
      grid.appendChild(buildDeviceTile(e, onToggle, options.large));
    }
    container.appendChild(grid);
  }
}

/** Full-stage device console (Thiết bị tab) — no left rail; rooms as horizontal tabs. */
export function renderDeviceStage(
  root: HTMLElement,
  entities: HaEntity[],
  selectedRoom: string,
  roomsOrder: string[],
  counts: Record<string, number>,
  onSelectRoom: (room: string) => void,
  onToggle: (e: HaEntity) => void,
  onTurnOffRoom: () => void,
  onTurnOnRoom: () => void,
  onRefresh: () => void,
) {
  root.innerHTML = '';
  const wrap = el('div', 'device-stage');

  // Head: tiêu đề + tổng số (hiển thị đẹp ở cả 2 bản dọc/ngang)
  const head = el('div', 'device-stage-head');
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const onCount = entities.filter((e) => e.isControllable && e.isOn).length;
  head.innerHTML = `<div class="device-stage-title">Thiết bị<small>${total} thiết bị · ${onCount} đang bật · ${selectedRoom}</small></div>`;
  wrap.appendChild(head);

  // Room tabs: bản dọc = cuộn ngang, bản ngang = sidebar dọc (xử lý bằng CSS)
  const roomTabs = el('div', 'room-tabs');
  roomTabs.setAttribute('role', 'tablist');
  roomTabs.setAttribute('aria-label', 'Phòng');
  const items: Array<[string, string, number]> = [
    ['Tất cả', '🏠', total],
    ...roomsOrder.map(
      (r) => [r, ROOM_ICON[r] ?? '📦', counts[r] ?? 0] as [string, string, number],
    ),
  ];
  for (const [id, icon, count] of items) {
    const btn = el('button', `room-tab${id === selectedRoom ? ' active' : ''}`);
    btn.innerHTML = `<span class="room-tab-icon">${icon}</span><span>${id}</span><span class="room-tab-count">${count}</span>`;
    btn.addEventListener('click', () => onSelectRoom(id));
    roomTabs.appendChild(btn);
  }
  wrap.appendChild(roomTabs);

  const bar = el('div', 'device-stage-bar');
  const actions = el('div', 'device-stage-actions');
  const refreshBtn = el('button', 'ghost-btn', '↻ Làm mới');
  refreshBtn.addEventListener('click', onRefresh);
  const onBtn = el('button', 'ghost-btn', '⚡ Bật phòng này');
  onBtn.addEventListener('click', onTurnOnRoom);
  const offBtn = el('button', 'ghost-btn', '🌙 Tắt phòng này');
  offBtn.addEventListener('click', onTurnOffRoom);
  actions.appendChild(refreshBtn);
  actions.appendChild(onBtn);
  actions.appendChild(offBtn);
  bar.appendChild(actions);
  wrap.appendChild(bar);

  const list = el('div', 'device-stage-list');
  renderDevices(list, entities, selectedRoom, roomsOrder, onToggle, { large: true });
  wrap.appendChild(list);
  root.appendChild(wrap);
}

export function renderLunar(
  root: HTMLElement,
  lunar: LunarDate,
  now: Date,
  fortune: FortuneReading,
  quote: FolkQuote,
  onQuoteNext: () => void,
) {
  root.innerHTML = '';
  const wrap = el('div', 'van-nien');
  const grid = el('div', 'panel-grid cols-2 van-nien-grid');

  const card1 = el('div', 'card');
  card1.appendChild(el('h3', undefined, 'Dương lịch'));
  const big = el('div', 'big-date');
  big.appendChild(el('div', 'solar', formatSolarVi(now)));
  big.appendChild(el('div', 'weekday', weekdayVi(now)));
  card1.appendChild(big);

  const lunarRow = el('div', 'lunar-row');
  const stamp = el('div', 'can-chi-stamp');
  stamp.innerHTML = `${lunar.canChiDay.split(' ')[0]}<br>${lunar.canChiDay.split(' ')[1]}`;
  lunarRow.appendChild(stamp);
  const ltext = el('div', 'lunar-text');
  ltext.appendChild(el('div', 'lunar-day', `Âm lịch ${lunar.lunarDay}/${lunar.lunarMonth}`));
  ltext.appendChild(
    el('div', 'lunar-extra', `${lunar.monthName} · Năm ${lunar.canChiYear} (${lunar.zodiacDay})`),
  );
  ltext.appendChild(el('div', 'lunar-extra', `Tháng ${lunar.canChiMonth}`));
  lunarRow.appendChild(ltext);
  card1.appendChild(lunarRow);

  const card2 = el('div', 'card');
  card2.appendChild(el('h3', undefined, 'Chi tiết'));
  const kv = el('div', 'kv');
  const rows: Array<[string, string]> = [
    ['Ngày Can Chi', lunar.canChiDay],
    ['Tháng Can Chi', lunar.canChiMonth],
    ['Năm Can Chi', lunar.canChiYear],
    ['Con giáp ngày', lunar.zodiacDay],
  ];
  for (const [k, v] of rows) {
    kv.appendChild(el('div', 'k', k));
    kv.appendChild(el('div', 'v', v));
  }
  card2.appendChild(kv);

  // Hours — fills the 4th grid cell beside fortune
  const hoursCard = el('div', 'card hours-card');
  hoursCard.appendChild(el('h3', undefined, 'Giờ trong ngày'));
  const good = el('div', 'lucky-hours');
  for (const h of lunar.goodHours) good.appendChild(el('span', 'lucky-chip', `Giờ ${h}`));
  hoursCard.appendChild(good);
  hoursCard.appendChild(el('div', 'hours-label', 'Giờ cần thận'));
  const bad = el('div', 'lucky-hours');
  for (const h of lunar.badHours) bad.appendChild(el('span', 'lucky-chip bad', `Giờ ${h}`));
  hoursCard.appendChild(bad);

  // Slot: Bói toán
  const fortuneCard = el('div', 'card fortune-compact');
  fortuneCard.appendChild(el('h3', undefined, 'Bói toán hôm nay'));
  const frow = el('div', 'fortune-compact-row');
  frow.appendChild(el('div', 'fortune-compact-emoji', fortune.emoji));
  const ftext = el('div', 'fortune-compact-text');
  ftext.appendChild(el('div', 'fortune-compact-title', fortune.title));
  ftext.appendChild(el('div', 'fortune-compact-sub', fortune.summary));
  frow.appendChild(ftext);
  const score = el('div', 'fortune-compact-score');
  score.innerHTML = `<span class="score-num">${fortune.score}</span><span class="score-lbl">điểm</span>`;
  frow.appendChild(score);
  fortuneCard.appendChild(frow);

  const fk = el('div', 'kv fortune-compact-kv');
  fk.appendChild(el('div', 'k', 'Màu may mắn'));
  fk.appendChild(el('div', 'v', fortune.luckyColor));
  fk.appendChild(el('div', 'k', 'Số may mắn'));
  fk.appendChild(el('div', 'v', String(fortune.luckyNumber)));
  fortuneCard.appendChild(fk);
  fortuneCard.appendChild(el('div', 'fortune-compact-advice', fortune.advice));

  // Row 1: solar | chi tiet
  grid.appendChild(card1);
  grid.appendChild(card2);
  // Row 2: fortune | hours
  grid.appendChild(fortuneCard);
  grid.appendChild(hoursCard);
  wrap.appendChild(grid);

  // Long quote bar — always pinned at bottom of the tab
  const quoteCard = el('div', 'card quote-card');
  const qhead = el('div', 'quote-head');
  qhead.appendChild(el('span', 'quote-kind', quote.kind));
  const nextBtn = el('button', 'ghost-btn quote-next', 'Câu khác →');
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onQuoteNext();
  });
  qhead.appendChild(nextBtn);
  quoteCard.appendChild(qhead);
  quoteCard.appendChild(el('div', 'quote-text', `“${quote.text}”`));
  if (quote.gloss) quoteCard.appendChild(el('div', 'quote-gloss', quote.gloss));
  wrap.appendChild(quoteCard);

  root.appendChild(wrap);
}

export function renderWeather(root: HTMLElement, now: WeatherNow, days: WeatherDay[]) {
  root.innerHTML = '';
  const grid = el('div', 'panel-grid cols-2');

  const hero = el('div', 'card');
  hero.appendChild(el('h3', undefined, 'TP. Hồ Chí Minh'));
  const heroRow = el('div', 'weather-hero');
  heroRow.appendChild(el('div', 'big-icon', now.icon));
  const tempBox = el('div');
  tempBox.appendChild(el('div', 'temp', `${now.temp}°C`));
  tempBox.appendChild(el('div', 'cond', now.desc));
  tempBox.appendChild(
    el('div', 'cond', `Cảm giác ${now.feels}° · Ẩm ${now.humidity}% · Gió ${now.wind} km/h`),
  );
  heroRow.appendChild(tempBox);
  hero.appendChild(heroRow);
  grid.appendChild(hero);

  const fc = el('div', 'card');
  fc.appendChild(el('h3', undefined, '5 ngày tới'));
  const row = el('div', 'forecast-row');
  for (const d of days.slice(0, 5)) {
    const cell = el('div', 'forecast-day');
    cell.appendChild(el('div', 'd', d.weekday));
    cell.appendChild(el('div', 'i', d.icon));
    cell.appendChild(el('div', 't', `${d.min}° ${d.max}°`));
    row.appendChild(cell);
  }
  fc.appendChild(row);
  grid.appendChild(fc);

  root.appendChild(grid);
}

export function renderTides(root: HTMLElement, events: TideEvent[]) {
  root.innerHTML = '';
  const grid = el('div', 'panel-grid cols-2');

  const chartCard = el('div', 'card');
  chartCard.appendChild(el('h3', undefined, 'Biểu đồ triều (24h) — Sông Sài Gòn / Vũng Tàu'));
  const canvas = el('canvas', 'tide-chart') as HTMLCanvasElement;
  canvas.width = 640;
  canvas.height = 160;
  chartCard.appendChild(canvas);
  grid.appendChild(chartCard);

  const listCard = el('div', 'card');
  listCard.appendChild(el('h3', undefined, 'Các lần triều sắp tới'));
  const list = el('div', 'tide-list');
  for (const ev of events.slice(0, 6)) {
    const item = el('div', 'tide-item');
    const left = el('div');
    left.appendChild(el('div', undefined, ev.kind === 'high' ? 'Cao điểm' : 'Đáy triều'));
    left.appendChild(el('div', 'cond', formatHourVi(ev.time)));
    item.appendChild(left);
    const badge = el('span', `badge ${ev.kind}`, `${ev.height.toFixed(2)} m`);
    item.appendChild(badge);
    list.appendChild(item);
  }
  if (!events.length) {
    list.appendChild(el('div', 'empty-hint', 'Không có dữ liệu'));
  }
  listCard.appendChild(list);
  grid.appendChild(listCard);
  root.appendChild(grid);

  // draw chart
  requestAnimationFrame(() => drawTideChart(canvas));
}

function drawTideChart(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const pts = tidePoints(new Date(), 24, 20);
  const w = canvas.width;
  const h = canvas.height;
  const pad = 16;
  const min = Math.min(...pts.map((p) => p.h)) - 0.15;
  const max = Math.max(...pts.map((p) => p.h)) + 0.15;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#2a3548';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((h - pad * 2) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = pad + ((w - pad * 2) * i) / (pts.length - 1);
    const y = h - pad - ((p.h - min) / (max - min)) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#3db8a8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // fill under curve
  ctx.lineTo(pad + (w - pad * 2), h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(61,184,168,0.25)');
  grad.addColorStop(1, 'rgba(61,184,168,0.02)');
  ctx.fillStyle = grad;
  ctx.fill();
}

export function renderFortune(root: HTMLElement, f: FortuneReading) {
  root.innerHTML = '';
  const grid = el('div', 'panel-grid cols-2');

  const hero = el('div', 'card');
  hero.appendChild(el('h3', undefined, 'Bói ngày hôm nay'));
  const fh = el('div', 'fortune-hero');
  fh.appendChild(el('div', 'emoji', f.emoji));
  fh.appendChild(el('div', 'title', f.title));
  fh.appendChild(el('div', 'subtitle', f.summary));
  fh.appendChild(el('div', 'subtitle', f.advice));
  hero.appendChild(fh);

  const meta = el('div', 'kv');
  meta.style.marginTop = '12px';
  meta.appendChild(el('div', 'k', 'Điểm ngày'));
  meta.appendChild(el('div', 'v', `${f.score}/100`));
  meta.appendChild(el('div', 'k', 'Màu may mắn'));
  meta.appendChild(el('div', 'v', f.luckyColor));
  meta.appendChild(el('div', 'k', 'Số may mắn'));
  meta.appendChild(el('div', 'v', String(f.luckyNumber)));
  hero.appendChild(meta);
  grid.appendChild(hero);

  const hours = el('div', 'card');
  hours.appendChild(el('h3', undefined, 'Giờ hoàng đạo / hắc đạo'));
  const good = el('div', 'lucky-hours');
  for (const h of f.luckyHours) good.appendChild(el('span', 'lucky-chip', `Giờ ${h}`));
  hours.appendChild(good);
  hours.appendChild(el('h3', undefined, 'Giờ cần thận'));
  const bad = el('div', 'lucky-hours');
  for (const h of f.unluckyHours) bad.appendChild(el('span', 'lucky-chip bad', `Giờ ${h}`));
  hours.appendChild(bad);
  grid.appendChild(hours);

  root.appendChild(grid);
}
