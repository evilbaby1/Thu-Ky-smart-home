import type { AppSettings } from './types';

const KEY = 'thuky.settings';

const defaults: AppSettings = {
  haUrl: '',
  haToken: '',
  wakePhrase: 'Thư Ký ơi',
  voiceReply: true,
  ownerName: 'anh',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}
