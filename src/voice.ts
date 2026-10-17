import type { AppSettings } from './types';
import { normalizeCommand } from './text';
import type { HomeAssistant } from './ha';
import { getLunarDate, formatSolarVi, weekdayVi } from './lunar';
import { fetchWeather } from './weather';
import { getFortune } from './fortune';

type SpeechRecognitionCtor = new () => any;

function getRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionCtor | null;
}

const ACKS = ['em nghe', 'dạ', 'vâng ạ', 'em nghe ạ', 'dạ em nghe'];

const WAKE_VARIANTS = [
  'thư ký ơi',
  'thư ky oi',
  'thư kì ơi',
  'thu ky oi',
  'thư ký',
  'hey thư ký',
  'thư ký ơi à',
  'thu ky o',
  'thư ký oi',
];

function normalizeVi(s: string): string {
  return normalizeCommand(s);
}

function containsWake(text: string): boolean {
  const n = normalizeVi(text);
  return WAKE_VARIANTS.some((w) => n.includes(normalizeVi(w)));
}

function stripWake(text: string): string {
  let n = text;
  for (const w of [...WAKE_VARIANTS, 'này', 'ơi', 'hỡi']) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    n = n.replace(re, ' ');
  }
  return n.replace(/\s+/g, ' ').trim();
}

export interface VoiceEngineEvents {
  onStatus: (msg: string) => void;
  onTranscript: (text: string) => void;
  onWake: () => void;
  onLevel: (level: number) => void;
  onCommandResult: (reply: string) => void;
}

export class VoiceEngine {
  private recog: any = null;
  private settings: AppSettings;
  private ha: HomeAssistant;
  private events: VoiceEngineEvents;
  private awake = false;
  private awakeTimer: number | null = null;
  listening = false;
  private restartTimer: number | null = null;

  constructor(settings: AppSettings, ha: HomeAssistant, events: VoiceEngineEvents) {
    this.settings = settings;
    this.ha = ha;
    this.events = events;
  }

  setSettings(s: AppSettings) {
    this.settings = s;
  }

  private speak(text: string) {
    if (!this.settings.voiceReply) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = 1;
      u.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const vi = voices.find((v) => v.lang?.toLowerCase().startsWith('vi'));
      if (vi) u.voice = vi;
      this.events.onStatus(`Đang trả lời…`);
      u.onend = () => this.events.onStatus(this.awake ? 'Đang nghe lệnh…' : 'Chờ “Thư Ký ơi”');
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }

  start() {
    const Ctor = getRecognition();
    if (!Ctor) {
      this.events.onStatus('Trình duyệt này không hỗ trợ nhận dạng giọng nói');
      return;
    }
    this.stop();
    const r = new Ctor();
    r.lang = 'vi-VN';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;

    r.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      const text = (final || interim).trim();
      if (text) this.events.onTranscript(text);
      if (final) void this.handleFinal(final);
    };

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        this.events.onStatus('Cần cấp quyền microphone');
        this.listening = false;
        return;
      }
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      this.events.onStatus(`Lỗi mic: ${e.error}`);
    };

    r.onend = () => {
      if (this.listening) {
        // auto-restart for continuous wake-word
        if (this.restartTimer != null) window.clearTimeout(this.restartTimer);
        this.restartTimer = window.setTimeout(() => {
          try {
            r.start();
          } catch {
            /* already started */
          }
        }, 250);
      }
    };

    this.recog = r;
    this.listening = true;
    try {
      r.start();
      this.events.onStatus('Đang nghe… gọi “Thư Ký ơi”');
    } catch {
      /* ignore */
    }
  }

  stop() {
    this.listening = false;
    if (this.restartTimer != null) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recog) {
      try {
        this.recog.stop();
      } catch {
        /* ignore */
      }
      this.recog = null;
    }
    if (this.awakeTimer != null) {
      window.clearTimeout(this.awakeTimer);
      this.awakeTimer = null;
    }
    this.awake = false;
    this.events.onStatus('Mic tắt');
  }

  toggle() {
    if (this.listening) this.stop();
    else this.start();
  }

  private markAwake() {
    this.awake = true;
    this.events.onWake();
    const ack = ACKS[Math.floor(Math.random() * ACKS.length)] ?? 'em nghe';
    const owner = this.settings.ownerName || 'anh';
    const greeting = Math.random() > 0.5 ? `${ack} ${owner}` : ack;
    this.speak(greeting);
    this.events.onCommandResult(greeting);
    if (this.awakeTimer != null) window.clearTimeout(this.awakeTimer);
    this.awakeTimer = window.setTimeout(() => {
      this.awake = false;
    }, 12000);
  }

  private async handleFinal(raw: string) {
    const text = raw.trim();
    if (!text) return;

    if (!this.awake && containsWake(text)) {
      this.markAwake();
      const rest = stripWake(text);
      if (rest.length > 1) {
        await this.handleCommand(rest);
      }
      return;
    }

    if (this.awake) {
      await this.handleCommand(text);
    }
  }

  private async handleCommand(cmd: string) {
    this.events.onStatus(`Lệnh: ${cmd}`);
    const n = normalizeVi(cmd);
    try {
      const reply = await this.runCommand(cmd, n);
      this.events.onCommandResult(reply);
      this.speak(reply);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Em chưa làm được';
      this.events.onCommandResult(msg);
      this.speak(msg);
    }
    this.awake = false;
    this.events.onStatus('Chờ “Thư Ký ơi”');
  }

  private async runCommand(original: string, n: string): Promise<string> {
    // Weather
    if (/(thoi tiet|troi|nhiet do|may mua|mua)/.test(n) && /(hom nay|bay gio|ngoai|the nao|ra sao|bao nhieu)/.test(n)) {
      const { now } = await fetchWeather();
      return `Ngoài trời ${now.desc}, ${now.temp} độ C, độ ẩm ${now.humidity} phần trăm.`;
    }
    if (n.includes('thoi tiet')) {
      const { now } = await fetchWeather();
      return `Hôm nay ${now.desc}, ${now.temp} độ, cảm giác như ${now.feels} độ.`;
    }

    // Date / lunar
    if (/(hom nay|ngay may|ngay nao|lich|am lich|van nien)/.test(n) && /(ngay|hom|may|nao|bao|lich)/.test(n)) {
      const d = new Date();
      const l = getLunarDate(d);
      return `Hôm nay là ${weekdayVi(d)}, ${formatSolarVi(d)}. Âm lịch ngày ${l.lunarDay}/${l.lunarMonth} (${l.monthName}), ${l.canChiDay}.`;
    }

    // Fortune
    if (/(boi|xem boi|van han|menh|hoang dao|tot xau)/.test(n)) {
      const f = getFortune();
      return `Hôm nay: ${f.title}. ${f.advice} Số may mắn ${f.luckyNumber}, màu ${f.luckyColor}.`;
    }

    // Turn all lights off
    if (/(tat tat ca|tat het|tat den tat|dong tat)/.test(n) || (n.includes('tat') && n.includes('den') && n.includes('tat ca'))) {
      await this.ha.turnOffAllLights();
      return 'Em đã tắt hết đèn rồi.';
    }

    // Find device + action
    const wantsOn = /\b(bat|mo|len|khong)\b/.test(n) || n.includes('bat') || n.includes('mo ');
    const wantsOff = n.includes('tat') || n.includes('dong') || n.includes('ngat');

    // Extract likely device query
    let deviceQuery = n
      .replace(/\b(thu ky oi|thu ky|oi|a|nhe|di|giup|em|ban|toi)\b/g, ' ')
      .replace(/\b(bat|tat|mo|dong|len|xuong|chuyen|dat)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // keyword hints
    if (/may lanh|dieu hoa|may lanh/.test(n)) deviceQuery = deviceQuery || 'máy lạnh';
    if (/quat/.test(n)) deviceQuery = deviceQuery || 'quạt';
    if (/\bden\b|den |den$/.test(n)) deviceQuery = deviceQuery || 'đèn';
    if (/tv|ti vi/.test(n)) deviceQuery = deviceQuery || 'tv';
    if (/rem/.test(n)) deviceQuery = deviceQuery || 'rèm';

    let matches = this.ha.findByName(deviceQuery);
    if (matches.length === 0) {
      // try common aliases
      const aliasMap: Array<[RegExp, string]> = [
        [/den/, 'đèn'],
        [/may lanh|dieu hoa/, 'máy lạnh'],
        [/quat/, 'quạt'],
        [/tv|ti vi/, 'tv'],
        [/rem/, 'rèm'],
        [/loa|nhac/, 'loa'],
      ];
      for (const [re, q] of aliasMap) {
        if (re.test(n)) {
          matches = this.ha.findByName(q);
          if (matches.length) break;
        }
      }
    }

    if (matches.length === 0) {
      if (this.ha.controllable().length === 0) {
        return 'Em chưa thấy thiết bị nào. Anh kiểm tra kết nối Home Assistant nhé.';
      }
      return `Em không tìm thấy thiết bị nào khớp với “${original}”.`;
    }

    // Prefer controllable
    const target = matches.find((m) => m.isControllable) ?? matches[0]!;
    const name = target.friendly_name;

    if (wantsOff && !wantsOn) {
      await this.ha.turnOff(target);
      return `Em đã tắt ${name}.`;
    }
    if (wantsOn || !wantsOff) {
      await this.ha.turnOn(target);
      return `Em đã bật ${name}.`;
    }
    await this.ha.toggle(target);
    return `Em đã đổi trạng thái ${name}.`;
  }

  /** Manual test command path (from UI) */
  async runTextCommand(text: string): Promise<void> {
    this.events.onTranscript(text);
    await this.handleCommand(text);
  }
}
