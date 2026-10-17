// Android 6 WebView compatibility
(function polyfillOldWebView() {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.globalThis === 'undefined') {
    (window as unknown as Record<string, unknown>).globalThis = window;
  }
  if (!String.prototype.normalize) {
    // extremely old — rare; skip
  }
})();

import './style.css';
import { loadSettings, saveSettings } from './config';
import { HomeAssistant } from './ha';
import { VoiceEngine } from './voice';
import { getLunarDate } from './lunar';
import { fetchWeather } from './weather';
import { tideForecast } from './tides';
import { getFortune } from './fortune';
import { quoteAt, todayQuoteIndex } from './quotes';
import {
  renderDeviceStage,
  renderLunar,
  renderWeather,
  renderTides,
  renderFortune,
} from './ui';
import type { TabId, WeatherDay, WeatherNow, HaEntity } from './types';

const byId = (id: string) => document.getElementById(id)!;
const byIdT = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const settings = loadSettings();
const ha = new HomeAssistant();
let weatherNow: WeatherNow | null = null;
let weatherDays: WeatherDay[] = [];
let activeTab: TabId = 'lunar';
let selectedRoom = 'Tất cả';
let quoteIndex = todayQuoteIndex();

/* ── Clock ─────────────────────────────────────────── */
function tickClock() {
  const now = new Date();
  byId('clock-time').textContent = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  byId('clock-date').textContent = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* ── Weather chip ──────────────────────────────────── */
function paintWeatherChip() {
  const chip = byId('weather-chip');
  if (!weatherNow) return;
  chip.innerHTML = `<span class="weather-icon">${weatherNow.icon}</span>
    <span class="weather-temp">${weatherNow.temp}°</span>
    <span class="weather-desc">${weatherNow.desc}</span>`;
}

async function loadWeather() {
  try {
    const data = await fetchWeather();
    weatherNow = data.now;
    weatherDays = data.days;
    paintWeatherChip();
    if (activeTab === 'weather') paintStage();
  } catch {
    /* keep previous */
  }
}

/* ── HA ────────────────────────────────────────────── */
function paintHaStatus() {
  const el = byId('ha-status');
  if (ha.connected) {
    el.dataset.state = 'connected';
    el.querySelector('.ha-label')!.textContent = 'HA đã kết nối';
    return;
  }
  if (ha.demoMode) {
    el.dataset.state = 'connecting';
    el.querySelector('.ha-label')!.textContent = 'Demo';
    return;
  }
  el.dataset.state = settings.haUrl ? 'connecting' : 'disconnected';
  el.querySelector('.ha-label')!.textContent = 'HA';
}

function roomCounts(list: HaEntity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of list) counts[e.room] = (counts[e.room] ?? 0) + 1;
  return counts;
}

function paintDevices() {
  // Device UI lives only on the Thiết bị tab (no left rail)
  if (activeTab === 'devices') paintStage();
}

function setDevicesInRoom(on: boolean) {
  const list = ha
    .controllable()
    .filter((e) => selectedRoom === 'Tất cả' || e.room === selectedRoom)
    .filter((e) => ['light', 'switch', 'fan', 'humidifier', 'input_boolean'].includes(e.domain));
  void (async () => {
    try {
      for (const e of list) {
        if (on) await ha.turnOn(e);
        else await ha.turnOff(e);
      }
      paintDevices();
      paintStage();
    } catch (err) {
      voiceEvents.onStatus(err instanceof Error ? err.message : 'Lỗi thiết bị');
    }
  })();
}

ha.onChange = () => {
  paintHaStatus();
  paintDevices();
};

/* ── Stage tabs ────────────────────────────────────── */
function paintStage() {
  const root = byId('stage-content');
  const now = new Date();
  const list = ha.controllable();
  const rooms = ha.rooms();
  const counts = roomCounts(list);

  if (activeTab === 'devices') {
    renderDeviceStage(
      root,
      list,
      selectedRoom,
      rooms,
      counts,
      (room) => {
        selectedRoom = room;
        paintDevices();
        paintStage();
      },
      async (e) => {
        try {
          await ha.toggle(e);
          paintDevices();
          paintStage();
        } catch (err) {
          voiceEvents.onStatus(err instanceof Error ? err.message : 'Lỗi thiết bị');
        }
      },
      () => setDevicesInRoom(false),
      () => setDevicesInRoom(true),
      () => {
        if (ha.demoMode) {
          ha.loadDemo();
          paintStage();
          return;
        }
        void ha.fetchStates().then(() => paintStage());
      },
    );
  } else if (activeTab === 'lunar') {
    renderLunar(
      root,
      getLunarDate(now),
      now,
      getFortune(now),
      quoteAt(quoteIndex),
      () => {
        quoteIndex += 1;
        paintStage();
      },
    );
  } else if (activeTab === 'weather') {
    if (weatherNow) renderWeather(root, weatherNow, weatherDays);
    else root.innerHTML = '<div class="empty-hint">Đang tải thời tiết…</div>';
  } else if (activeTab === 'tides') {
    renderTides(root, tideForecast(new Date(), 36));
  } else if (activeTab === 'fortune') {
    renderFortune(root, getFortune(now));
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = (tab.dataset.tab as TabId) || 'lunar';
      paintStage();
    });
  });
}

/* ── Voice ─────────────────────────────────────────── */
function setMicListening(listening: boolean) {
  const btn = byId('btn-mic');
  btn.classList.toggle('listening', listening);
  btn.classList.toggle('speaking', false);
}

function wakeFlash() {
  let flash = document.querySelector('.wake-flash');
  if (!flash) {
    flash = document.createElement('div');
    flash.className = 'wake-flash';
    document.body.appendChild(flash);
  }
  flash.classList.add('show');
  window.setTimeout(() => flash.classList.remove('show'), 600);
}

const voiceEvents = {
  onStatus: (msg: string) => {
    byId('voice-status').textContent = msg;
  },
  onTranscript: (text: string) => {
    byId('voice-transcript').textContent = text;
  },
  onWake: () => {
    wakeFlash();
    byId('voice-status').textContent = 'Em nghe…';
  },
  onLevel: () => {
    /* reserved */
  },
  onCommandResult: (reply: string) => {
    byId('voice-transcript').textContent = reply;
  },
};

const voice = new VoiceEngine(settings, ha, voiceEvents);

function setupVoice() {
  byId('btn-mic').addEventListener('click', () => {
    if (!voice.listening) voice.start();
    else voice.stop();
    setMicListening(voice.listening);
  });
  // prime voices list
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

/* ── Layout: đứng / ngang / tự động ─────────────── */
type LayoutMode = 'auto' | 'portrait' | 'landscape';
const LAYOUT_KEY = 'thuky.layout';

function getLayoutMode(): LayoutMode {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw === 'portrait' || raw === 'landscape' || raw === 'auto') return raw;
  } catch { /* ignore */ }
  return 'auto';
}

function applyLayout(mode: LayoutMode) {
  try {
    localStorage.setItem(LAYOUT_KEY, mode);
  } catch { /* ignore */ }
  document.body.dataset.layout = mode;
  document.body.classList.toggle('layout-portrait', mode === 'portrait');
  document.body.classList.toggle('layout-landscape', mode === 'landscape');
  // auto: để CSS media query quyết định, nhưng vẫn gợi ý class để preview mượt
  if (mode === 'auto') {
    const narrow = window.matchMedia('(max-width: 720px)').matches;
    document.body.classList.toggle('layout-portrait', false);
    document.body.classList.toggle('layout-landscape', false);
    void narrow;
  }
  for (const m of ['portrait', 'auto', 'landscape'] as LayoutMode[]) {
    document.getElementById(`btn-layout-${m}`)?.classList.toggle('active', m === mode);
  }
}

function setupLayout() {
  applyLayout(getLayoutMode());
  for (const m of ['portrait', 'auto', 'landscape'] as LayoutMode[]) {
    document.getElementById(`btn-layout-${m}`)?.addEventListener('click', () => applyLayout(m));
  }
  // Khi xoay màn hình / resize mà đang để auto thì vẽ lại để grid đổi cột mượt
  let t = 0;
  window.addEventListener('resize', () => {
    if (getLayoutMode() !== 'auto') return;
    window.clearTimeout(t);
    t = window.setTimeout(() => paintStage(), 180);
  });
  window.matchMedia('(orientation: portrait)').addEventListener?.('change', () => {
    if (getLayoutMode() === 'auto') paintStage();
  });
}

/* ── Settings drawer ───────────────────────────────── */
function openSettings(open: boolean) {
  byId('settings-drawer').classList.toggle('open', open);
  byId('settings-drawer').setAttribute('aria-hidden', open ? 'false' : 'true');
  byId('settings-backdrop').classList.toggle('hidden', !open);
}

function fillSettingsForm() {
  byIdT<HTMLInputElement>('cfg-ha-url').value = settings.haUrl;
  byIdT<HTMLInputElement>('cfg-ha-token').value = settings.haToken;
  byIdT<HTMLInputElement>('cfg-wake-phrase').value = settings.wakePhrase;
  byIdT<HTMLInputElement>('cfg-voice-reply').checked = settings.voiceReply;
  byIdT<HTMLInputElement>('cfg-owner-name').value = settings.ownerName;
}

function setupSettings() {
  byId('btn-settings').addEventListener('click', () => {
    fillSettingsForm();
    openSettings(true);
  });
  byId('btn-close-settings').addEventListener('click', () => openSettings(false));
  byId('settings-backdrop').addEventListener('click', () => openSettings(false));

  byIdT<HTMLFormElement>('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    settings.haUrl = byIdT<HTMLInputElement>('cfg-ha-url').value.trim();
    settings.haToken = byIdT<HTMLInputElement>('cfg-ha-token').value.trim();
    settings.wakePhrase = byIdT<HTMLInputElement>('cfg-wake-phrase').value.trim() || 'Thư Ký ơi';
    settings.voiceReply = byIdT<HTMLInputElement>('cfg-voice-reply').checked;
    settings.ownerName = byIdT<HTMLInputElement>('cfg-owner-name').value.trim() || 'anh';
    saveSettings(settings);
    voice.setSettings(settings);
    ha.configure(settings.haUrl, settings.haToken);
    byId('wake-label').textContent = `Wake: ${settings.wakePhrase}`;
    byId('settings-msg').textContent = 'Đã lưu cài đặt.';
    void connectHa();
  });

  byId('btn-test-ha').addEventListener('click', async () => {
    const url = byIdT<HTMLInputElement>('cfg-ha-url').value.trim();
    const token = byIdT<HTMLInputElement>('cfg-ha-token').value.trim();
    ha.configure(url, token);
    const res = await ha.test();
    byId('settings-msg').textContent = res.message;
    byId('settings-msg').style.color = res.ok ? 'var(--teal)' : 'var(--red)';
  });
}

async function connectHa() {
  if (!settings.haUrl || !settings.haToken) {
    ha.loadDemo();
    paintHaStatus();
    paintDevices();
    voiceEvents.onStatus('Chế độ Demo — 12 thiết bị mẫu. Vào Cài đặt để nối Home Assistant.');
    return;
  }
  ha.configure(settings.haUrl, settings.haToken);
  paintHaStatus();
  try {
    await ha.fetchStates();
    ha.startPolling(20000);
    paintHaStatus();
    paintDevices();
    voiceEvents.onStatus('Đã kết nối Home Assistant');
  } catch (e) {
    ha.connected = false;
    ha.loadDemo();
    paintHaStatus();
    paintDevices();
    paintStage();
    const msg = e instanceof Error ? e.message : 'Không kết nối được HA';
    voiceEvents.onStatus(`${msg} — đang dùng thiết bị demo. Kiểm tra URL/token trong Cài đặt.`);
  }
}

/* ── Boot ──────────────────────────────────────────── */
function boot() {
  tickClock();
  window.setInterval(tickClock, 1000);
  setupLayout();
  setupTabs();
  setupVoice();
  setupSettings();
  paintStage();
  paintHaStatus();
  void loadWeather();
  window.setInterval(() => void loadWeather(), 10 * 60 * 1000);
  void connectHa();

  // refresh lunar/fortune and rotate quote
  window.setInterval(() => {
    quoteIndex += 1;
    if (activeTab === 'lunar' || activeTab === 'fortune' || activeTab === 'tides') paintStage();
  }, 45 * 1000);

  // Wake-word needs mic; browsers require a user gesture the first time.
  const armVoice = () => {
    if (voice.listening) return;
    voice.start();
    setMicListening(true);
    byId('voice-status').textContent = 'Đang nghe… gọi “Thư Ký ơi”';
  };
  document.body.addEventListener(
    'pointerdown',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('#btn-mic')) return;
      armVoice();
    },
    { once: true },
  );

  voiceEvents.onStatus('Chạm màn hình để bật mic — gọi “Thư Ký ơi”');
}

boot();
