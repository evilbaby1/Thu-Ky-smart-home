export interface AppSettings {
  haUrl: string;
  haToken: string;
  wakePhrase: string;
  voiceReply: boolean;
  ownerName: string;
}

export interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  friendly_name: string;
  domain: string;
  isOn: boolean;
  isControllable: boolean;
  /** Room / area label in Vietnamese */
  room: string;
  /** Short display name (room suffix stripped when possible) */
  shortName: string;
}

export type TabId = 'devices' | 'lunar' | 'weather' | 'tides' | 'fortune';

export interface WeatherNow {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  desc: string;
  icon: string;
}

export interface WeatherDay {
  date: string;
  weekday: string;
  code: number;
  desc: string;
  icon: string;
  min: number;
  max: number;
}

export interface LunarDate {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeap: boolean;
  canChiDay: string;
  canChiMonth: string;
  canChiYear: string;
  zodiacDay: string;
  monthName: string;
  goodHours: string[];
  badHours: string[];
}

export interface TideEvent {
  time: Date;
  height: number;
  kind: 'high' | 'low';
}
