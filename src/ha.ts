import type { HaEntity } from './types';
import { stripVi } from './text';

const CONTROLLABLE = new Set([
  'light',
  'switch',
  'fan',
  'climate',
  'cover',
  'media_player',
  'humidifier',
  'vacuum',
  'input_boolean',
]);

const TOGGLEABLE = new Set(['light', 'switch', 'fan', 'input_boolean', 'humidifier']);

/** Prefer native HTTP (Android) so LAN HA is not blocked by browser CORS. */
async function httpGet<T>(url: string, token: string): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  try {
    const { Capacitor, CapacitorHttp } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.get({ url, headers });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      return (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as T;
    }
  } catch (e) {
    if (e instanceof Error && /HTTP \d+/.test(e.message)) throw e;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function httpSend(
  url: string,
  token: string,
  method: 'POST',
  body: unknown,
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const json = JSON.stringify(body);
  try {
    const { Capacitor, CapacitorHttp } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({ url, headers, data: json });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      return;
    }
  } catch (e) {
    if (e instanceof Error && /HTTP \d+/.test(e.message)) throw e;
  }
  const res = await fetch(url, { method, headers, body: json });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Entity-id / name → room (specific first). Tuned for common VN HA setups. */
const ROOM_PATTERNS: Array<[RegExp, string]> = [
  [/phong[_ ]?(be[_ ]?xiu|be xiu)|be[_ ]?xiu/, 'Phòng bé xíu'],
  [/phong[_ ]?(bi[_ ]?bo|bi bo)|bi[_ ]?bo/, 'Phòng bi bo'],
  [/phong[_ ]?master|[^a-z]master[^a-z]|wc[_ ]?master/, 'Phòng master'],
  [/ba[_ ]?me|ba me/, 'Phòng ba mẹ'],
  [/be[_ ]?gai/, 'Phòng bé gái'],
  [/be[_ ]?trai/, 'Phòng bé trai'],
  [/phong[_ ]?khach|[^a-z]khach[^a-z]|living/, 'Phòng khách'],
  [/phong[_ ]?ngu|bedroom/, 'Phòng ngủ'],
  [/phong[_ ]?(lam[_ ]?viec|office|study)/, 'Phòng làm việc'],
  [/phong[_ ]?(be|con|tre|em)/, 'Phòng trẻ em'],
  [/wc[_ ]?chung|phong[_ ]?tam|nha[_ ]?tam|ve[_ ]?sinh|[^a-z]wc[^a-z]|bath|tolet|toi[_ ]?let/, 'Nhà tắm'],
  [/bep|kitchen/, 'Bếp'],
  [/ban[_ ]?cong|san[_ ]?thuong|san[_ ]?vuon|garden|outdoor/, 'Ban công'],
  [/cua[_ ]?chinh|cua[_ ]?truoc|front[_ ]?door/, 'Cửa chính'],
  [/garage|o[_ ]?to/, 'Garage'],
  [/ho[_ ]?boi|pool/, 'Hồ bơi'],
  [/hanh[_ ]?lang|hallway|corridor/, 'Hành lang'],
  [/rem_|curtain/, 'Rèm cửa'],
];

function inferRoom(friendly: string, entityId: string, attributes: Record<string, unknown>): string {
  const explicit =
    (attributes.area as string | undefined) ||
    (attributes.area_id as string | undefined) ||
    (attributes.room as string | undefined);
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }
  const hay = stripVi(`${friendly} ${entityId.replace(/[._]/g, ' ')}`);
  for (const [re, label] of ROOM_PATTERNS) {
    if (re.test(hay)) return label;
  }
  return 'Khác';
}

/** Accept "192.168.1.13", "http://192.168.1.13:8123", with/without trailing slash. */
function normalizeHaUrl(raw: string): string {
  let u = raw.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  u = u.replace(/\/+$/, '');
  return u;
}

const DOMAIN_LABEL: Record<string, string> = {
  light: 'đèn',
  switch: 'công tắc',
  fan: 'quạt',
  climate: 'máy lạnh',
  cover: 'rèm',
  media_player: 'loa',
  humidifier: 'máy tạo ẩm',
  vacuum: 'robot',
  input_boolean: 'hẹn giờ',
};

function shortNameOf(friendly: string, room: string): string {
  let name = friendly;
  if (room && room !== 'Khác') {
    const re = new RegExp(`\\s*(${room}|${room.replace(/^Phòng /i, '')})\\s*$`, 'i');
    name = name.replace(re, '').trim();
  }
  name = name.replace(/\s+/g, ' ').trim();
  return name || friendly;
}

/** Domains a generic `switch` merely duplicates (same relay, a richer entity exists). */
const SWITCH_DUPLICATED_BY = new Set([
  'light',
  'fan',
  'climate',
  'cover',
  'media_player',
  'humidifier',
  'vacuum',
]);

function normLabel(s: string): string {
  return stripVi(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Many devices (Tuya, Sonoff, ESPHome bridges…) expose the SAME relay twice — e.g.
 * `light.den_bep` and `switch.den_bep` with an identical friendly_name. Keep the richer
 * entity (light/fan/…) and drop the redundant switch so the UI shows one tile per device.
 */
function mergeDuplicateSwitches(entities: HaEntity[]): HaEntity[] {
  const groups = new Map<string, HaEntity[]>();
  for (const e of entities) {
    const key = `${e.room}||${normLabel(e.friendly_name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const drop = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const primary = group.find((e) => SWITCH_DUPLICATED_BY.has(e.domain));
    if (!primary) continue;
    for (const e of group) {
      if (e.domain === 'switch' && e.entity_id !== primary.entity_id) {
        drop.add(e.entity_id);
        // Carry over "on" state so a switch that is actually on isn't shown as off.
        if (e.isOn && !primary.isOn) {
          primary.isOn = true;
          primary.state = e.state;
        }
      }
    }
  }
  return entities.filter((e) => !drop.has(e.entity_id));
}

/** Make short names unique inside a room so tiles are not ambiguous. */
function dedupeShortNames(entities: HaEntity[]): HaEntity[] {
  const byKey = new Map<string, HaEntity[]>();
  for (const e of entities) {
    const key = `${e.room}||${e.shortName.toLowerCase()}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(e);
  }

  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    // Prefer domain suffix first (đèn vs công tắc), then entity tail
    const used = new Set<string>();
    for (const e of group) {
      const label = DOMAIN_LABEL[e.domain] ?? e.domain;
      let name = `${e.shortName} (${label})`;
      if (used.has(name.toLowerCase())) {
        const tail = e.entity_id.split('.').pop() ?? '';
        name = `${e.shortName} · ${tail.replace(/_/g, ' ').slice(0, 18)}`;
      }
      used.add(name.toLowerCase());
      e.shortName = name;
    }
    // If still colliding (same domain), append 1/2/3
    const seen = new Map<string, number>();
    for (const e of group) {
      const k = e.shortName.toLowerCase();
      const n = (seen.get(k) ?? 0) + 1;
      seen.set(k, n);
      if (n > 1) e.shortName = `${e.shortName} ${n}`;
    }
  }
  return entities;
}

function attrs(entity: {
  attributes: Record<string, unknown>;
  entity_id: string;
  state: string;
}): HaEntity {
  const domain = entity.entity_id.split('.')[0] ?? '';
  const friendly =
    (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id;
  const on = ['on', 'open', 'opening', 'heat', 'cool', 'auto', 'dry', 'fan_only', 'playing'].includes(
    entity.state,
  );
  const room = inferRoom(friendly, entity.entity_id, entity.attributes);
  return {
    entity_id: entity.entity_id,
    state: entity.state,
    attributes: entity.attributes,
    friendly_name: friendly,
    domain,
    isOn: on,
    isControllable: CONTROLLABLE.has(domain),
    room,
    shortName: shortNameOf(friendly, room),
  };
}

const DEMO_ENTITIES: Array<{
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}> = [
  // Phòng khách
  { entity_id: 'light.phong_khach', state: 'on', attributes: { friendly_name: 'Đèn phòng khách', area: 'Phòng khách', brightness: 180 } },
  { entity_id: 'light.ke_sach', state: 'on', attributes: { friendly_name: 'Đèn kệ sách', area: 'Phòng khách', brightness: 90 } },
  { entity_id: 'climate.may_lanh_phong_khach', state: 'cool', attributes: { friendly_name: 'Máy lạnh', area: 'Phòng khách', temperature: 26, current_temperature: 28 } },
  { entity_id: 'fan.quat_phong_khach', state: 'on', attributes: { friendly_name: 'Quạt', area: 'Phòng khách', percentage: 60 } },
  { entity_id: 'switch.tv_phong_khach', state: 'off', attributes: { friendly_name: 'TV', area: 'Phòng khách' } },
  { entity_id: 'media_player.loa_phong_khach', state: 'playing', attributes: { friendly_name: 'Loa', area: 'Phòng khách', media_title: 'Nhạc Bolero' } },
  { entity_id: 'cover.rem_cua_so', state: 'open', attributes: { friendly_name: 'Rèm cửa sổ', area: 'Phòng khách', current_position: 80 } },
  // Phòng ngủ
  { entity_id: 'light.phong_ngu', state: 'off', attributes: { friendly_name: 'Đèn ngủ', area: 'Phòng ngủ' } },
  { entity_id: 'light.den_doc', state: 'off', attributes: { friendly_name: 'Đèn đọc sách', area: 'Phòng ngủ' } },
  { entity_id: 'climate.may_lanh_phong_ngu', state: 'off', attributes: { friendly_name: 'Máy lạnh', area: 'Phòng ngủ', temperature: 25 } },
  { entity_id: 'fan.quat_phong_ngu', state: 'off', attributes: { friendly_name: 'Quạt', area: 'Phòng ngủ' } },
  // Bếp
  { entity_id: 'light.bep', state: 'off', attributes: { friendly_name: 'Đèn bếp', area: 'Bếp' } },
  { entity_id: 'switch.hut_mui', state: 'off', attributes: { friendly_name: 'Máy hút mùi', area: 'Bếp' } },
  // Nhà tắm
  { entity_id: 'light.nha_tam', state: 'off', attributes: { friendly_name: 'Đèn', area: 'Nhà tắm' } },
  { entity_id: 'switch.may_nuoc_nong', state: 'on', attributes: { friendly_name: 'Máy nước nóng', area: 'Nhà tắm' } },
  // Ban công
  { entity_id: 'light.ban_cong', state: 'off', attributes: { friendly_name: 'Đèn ban công', area: 'Ban công' } },
  { entity_id: 'switch.bom_nuoc', state: 'off', attributes: { friendly_name: 'Máy bơm nước', area: 'Ban công' } },
];

export class HomeAssistant {
  private url = '';
  private token = '';
  connected = false;
  demoMode = false;
  entities: HaEntity[] = [];
  onChange: (() => void) | null = null;
  private pollTimer: number | null = null;
  private reconcileTimers: number[] = [];

  configure(url: string, token: string): void {
    this.url = normalizeHaUrl(url);
    this.token = token.trim();
    if (this.url && this.token) this.demoMode = false;
  }

  /** Sample household so the UI can be previewed without Home Assistant. */
  loadDemo(): void {
    this.demoMode = true;
    this.connected = false;
    this.entities = dedupeShortNames(mergeDuplicateSwitches(DEMO_ENTITIES.map(attrs)));
    this.onChange?.();
  }



  async test(): Promise<{ ok: boolean; message: string }> {
    if (!this.url || !this.token) {
      return { ok: false, message: 'Chưa nhập URL hoặc token' };
    }
    try {
      const data = await httpGet<{ message?: string }>(`${this.url}/api/`, this.token);
      return { ok: true, message: data.message ?? `Kết nối thành công (${this.url})` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi kết nối';
      return {
        ok: false,
        message: `${msg}. URL: http://192.168.1.13. Trên PC phải mở app bằng http://localhost:5173 (đừng dùng 127.0.0.1:4173 — HA chặn CORS).`,
      };
    }
  }

  async fetchStates(): Promise<HaEntity[]> {
    if (!this.url || !this.token) return [];
    const raw = await httpGet<
      Array<{
        entity_id: string;
        state: string;
        attributes: Record<string, unknown>;
      }>
    >(`${this.url}/api/states`, this.token);
    this.entities = dedupeShortNames(
      mergeDuplicateSwitches(
        raw
          .map(attrs)
          .filter(
            (e) =>
              e.isControllable ||
              e.domain === 'sensor' ||
              e.domain === 'weather' ||
              e.domain === 'binary_sensor',
          ),
      ),
    );
    this.connected = true;
    this.onChange?.();
    return this.entities;
  }

  startPolling(intervalMs = 15000): void {
    this.stopPolling();
    const tick = async () => {
      try {
        await this.fetchStates();
      } catch {
        this.connected = false;
        this.onChange?.();
      }
    };
    void tick();
    this.pollTimer = window.setInterval(tick, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer != null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  controllable(): HaEntity[] {
    return this.entities
      .filter((e) => e.isControllable)
      .sort((a, b) => a.room.localeCompare(b.room, 'vi') || a.shortName.localeCompare(b.shortName, 'vi'));
  }

  /** Unique room labels in display order. */
  rooms(): string[] {
    const order = [
      'Phòng khách',
      'Phòng master',
      'Phòng bé xíu',
      'Phòng bi bo',
      'Phòng ngủ',
      'Phòng làm việc',
      'Phòng trẻ em',
      'Bếp',
      'Nhà tắm',
      'Hành lang',
      'Rèm cửa',
      'Ban công',
      'Garage',
      'Hồ bơi',
      'Khác',
    ];
    const seen = new Set(this.controllable().map((e) => e.room));
    const known = order.filter((r) => seen.has(r));
    const extra = [...seen].filter((r) => !order.includes(r)).sort((a, b) => a.localeCompare(b, 'vi'));
    return [...known, ...extra];
  }

  /**
   * HA applies service calls asynchronously, so reading states immediately returns the
   * OLD value. We re-read a couple of times shortly after to reconcile (until then the UI
   * keeps the optimistic value set in toggle/turnOn/turnOff).
   */
  private reconcileSoon(): void {
    if (this.demoMode) return;
    for (const t of this.reconcileTimers) window.clearTimeout(t);
    this.reconcileTimers = [];
    for (const delay of [450, 1400, 2600]) {
      this.reconcileTimers.push(
        window.setTimeout(() => {
          void this.fetchStates().catch(() => {
            /* keep optimistic value; polling will retry */
          });
        }, delay),
      );
    }
  }

  private async callService(domain: string, service: string, entityId: string, data: object = {}) {
    if (!this.url || !this.token) throw new Error('Chưa cấu hình HA');
    await httpSend(`${this.url}/api/services/${domain}/${service}`, this.token, 'POST', {
      entity_id: entityId,
      ...data,
    });
    this.reconcileSoon();
  }

  private setLocalState(entityId: string, on: boolean): void {
    const idx = this.entities.findIndex((e) => e.entity_id === entityId);
    if (idx < 0) return;
    const cur = this.entities[idx]!;
    const domain = cur.domain;
    const state = on
      ? domain === 'cover'
        ? 'open'
        : domain === 'climate'
          ? 'cool'
          : domain === 'media_player'
            ? 'playing'
            : 'on'
      : domain === 'cover'
        ? 'closed'
        : 'off';
    this.entities[idx] = { ...cur, isOn: on, state };
    this.onChange?.();
  }

  async toggle(entity: HaEntity): Promise<void> {
    const nextOn = !entity.isOn;
    if (this.demoMode) {
      this.setLocalState(entity.entity_id, nextOn);
      return;
    }
    // Optimistic: flip the tile instantly, then reconcile with HA a moment later.
    this.setLocalState(entity.entity_id, nextOn);
    const domain = entity.domain;
    try {
      if (domain === 'cover') {
        await this.callService('cover', nextOn ? 'open_cover' : 'close_cover', entity.entity_id);
        return;
      }
      if (domain === 'climate') {
        await this.callService('climate', nextOn ? 'turn_on' : 'turn_off', entity.entity_id);
        return;
      }
      if (domain === 'media_player') {
        await this.callService('media_player', nextOn ? 'turn_on' : 'turn_off', entity.entity_id);
        return;
      }
      if (domain === 'vacuum') {
        await this.callService('vacuum', nextOn ? 'start' : 'return_to_base', entity.entity_id);
        return;
      }
      if (TOGGLEABLE.has(domain)) {
        await this.callService(domain, nextOn ? 'turn_on' : 'turn_off', entity.entity_id);
      }
    } catch (err) {
      // Roll back if the command was rejected.
      this.setLocalState(entity.entity_id, entity.isOn);
      throw err;
    }
  }

  async turnOn(entity: HaEntity): Promise<void> {
    if (this.demoMode) {
      this.setLocalState(entity.entity_id, true);
      return;
    }
    this.setLocalState(entity.entity_id, true);
    const domain = entity.domain === 'cover' ? 'cover' : entity.domain;
    const service = entity.domain === 'cover' ? 'open_cover' : 'turn_on';
    try {
      await this.callService(domain, service, entity.entity_id);
    } catch (err) {
      this.setLocalState(entity.entity_id, false);
      throw err;
    }
  }

  async turnOff(entity: HaEntity): Promise<void> {
    if (this.demoMode) {
      this.setLocalState(entity.entity_id, false);
      return;
    }
    this.setLocalState(entity.entity_id, false);
    const domain = entity.domain === 'cover' ? 'cover' : entity.domain;
    const service = entity.domain === 'cover' ? 'close_cover' : 'turn_off';
    try {
      await this.callService(domain, service, entity.entity_id);
    } catch (err) {
      this.setLocalState(entity.entity_id, true);
      throw err;
    }
  }

  async turnOffAllLights(): Promise<void> {
    if (this.demoMode) {
      for (const e of this.entities) {
        if (e.domain === 'light') this.setLocalState(e.entity_id, false);
      }
      this.onChange?.();
      return;
    }
    if (!this.url || !this.token) throw new Error('Chưa cấu hình HA');
    for (const e of this.entities) {
      if (e.domain === 'light') this.setLocalState(e.entity_id, false);
    }
    await httpSend(`${this.url}/api/services/light/turn_off`, this.token, 'POST', {
      entity_id: 'all',
    });
    this.reconcileSoon();
  }

  findByName(query: string): HaEntity[] {
    const q = stripVi(query).trim();
    if (!q) return [];
    return this.entities.filter((e) => {
      const name = stripVi(e.friendly_name);
      return name.includes(q) || e.entity_id.toLowerCase().includes(q);
    });
  }
}
