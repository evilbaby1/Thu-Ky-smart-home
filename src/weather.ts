import type { WeatherDay, WeatherNow } from './types';

// Open-Meteo — free, no API key. HCMC default.
const LAT = 10.8231;
const LON = 106.6297;
const TZ = 'Asia/Ho_Chi_Minh';

const WMO: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Trời quang', icon: '☀️' },
  1: { desc: 'Ít mây', icon: '🌤️' },
  2: { desc: 'Có mây', icon: '⛅' },
  3: { desc: 'Nhiều mây', icon: '☁️' },
  45: { desc: 'Sương mù', icon: '🌫️' },
  48: { desc: 'Sương muối', icon: '🌫️' },
  51: { desc: 'Mưa phùn nhẹ', icon: '🌦️' },
  53: { desc: 'Mưa phùn', icon: '🌦️' },
  55: { desc: 'Mưa phùn dày', icon: '🌧️' },
  61: { desc: 'Mưa nhẹ', icon: '🌦️' },
  63: { desc: 'Mưa', icon: '🌧️' },
  65: { desc: 'Mưa to', icon: '🌧️' },
  66: { desc: 'Mưa băng', icon: '🌧️' },
  67: { desc: 'Mưa băng to', icon: '🌧️' },
  71: { desc: 'Tuyết nhẹ', icon: '🌨️' },
  73: { desc: 'Tuyết', icon: '🌨️' },
  75: { desc: 'Tuyết to', icon: '❄️' },
  77: { desc: 'Hạt tuyết', icon: '❄️' },
  80: { desc: 'Mưa rào nhẹ', icon: '🌦️' },
  81: { desc: 'Mưa rào', icon: '🌧️' },
  82: { desc: 'Mưa rào to', icon: '⛈️' },
  85: { desc: 'Mưa tuyết nhẹ', icon: '🌨️' },
  86: { desc: 'Mưa tuyết', icon: '🌨️' },
  95: { desc: 'Dông', icon: '⛈️' },
  96: { desc: 'Dông mưa đá', icon: '⛈️' },
  99: { desc: 'Dông mưa đá lớn', icon: '⛈️' },
};

function wmo(code: number) {
  return WMO[code] ?? { desc: 'Không rõ', icon: '🌡️' };
}

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export async function fetchWeather(): Promise<{ now: WeatherNow; days: WeatherDay[] }> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=${encodeURIComponent(TZ)}&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const data = await res.json();

  const code = data.current?.weather_code ?? 0;
  const meta = wmo(code);
  const now: WeatherNow = {
    temp: Math.round(data.current?.temperature_2m ?? 0),
    feels: Math.round(data.current?.apparent_temperature ?? 0),
    humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
    wind: Math.round(data.current?.wind_speed_10m ?? 0),
    code,
    desc: meta.desc,
    icon: meta.icon,
  };

  const days: WeatherDay[] = (data.daily?.time ?? []).map((date: string, i: number) => {
    const d = new Date(date + 'T12:00:00');
    const c = data.daily.weather_code?.[i] ?? 0;
    const m = wmo(c);
    return {
      date,
      weekday: WEEKDAY[d.getDay()] ?? '',
      code: c,
      desc: m.desc,
      icon: m.icon,
      min: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
      max: Math.round(data.daily.temperature_2m_max?.[i] ?? 0),
    };
  });

  return { now, days };
}
