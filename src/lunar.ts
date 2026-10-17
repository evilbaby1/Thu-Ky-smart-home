import type { LunarDate } from './types';

/**
 * Classic lunar calendar tables (1900–2100), same packing as the widely used
 * Chinese/Vietnamese calendar.js:
 *   bits 0–3   = leap month (0 = none)
 *   bit 16     = leap month has 30 days
 *   bits 4–15  = 12 month lengths (bit15=month1 … bit4=month12), 1 = 30 days
 */
const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const ZODIAC = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const LUNAR_MONTHS = [
  'Tháng Giêng', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
  'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Một', 'Tháng Chạp',
];

function info(y: number): number {
  return LUNAR_INFO[y - 1900] ?? 0x04bd8;
}

function leapMonth(y: number): number {
  return info(y) & 0xf;
}

function leapDays(y: number): number {
  if (!leapMonth(y)) return 0;
  return info(y) & 0x10000 ? 30 : 29;
}

function monthDays(y: number, m: number): number {
  return info(y) & (0x10000 >> m) ? 30 : 29;
}

function yearDays(y: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (info(y) & i) sum += 1;
  }
  return sum + leapDays(y);
}

function walkLunar(solar: Date): { y: number; m: number; d: number; isLeap: boolean } {
  // 1900-01-31 is lunar 1900-01-01 in this table family
  let offset = Math.round(
    (Date.UTC(solar.getFullYear(), solar.getMonth(), solar.getDate()) - Date.UTC(1900, 0, 31)) /
      86400000,
  );

  let y = 1900;
  let temp = 0;
  for (; y < 2101 && offset > 0; y++) {
    temp = yearDays(y);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    y -= 1;
  }

  const year = y;
  const leap = leapMonth(year);
  let isLeap = false;
  let m = 1;
  for (; m < 13 && offset > 0; m++) {
    if (leap > 0 && m === leap + 1 && !isLeap) {
      m -= 1;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, m);
    }
    if (isLeap && m === leap + 1) {
      isLeap = false;
    }
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && m === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      m -= 1;
    }
  }
  if (offset < 0) {
    offset += temp;
    m -= 1;
  }
  return { y: year, m, d: offset + 1, isLeap };
}

/** Day stem-branch. 2000-01-01 = Đinh Tỵ (widely cited). */
export function canChiDay(date: Date): string {
  const jdn =
    Math.floor(date.getTime() / 86400000 + 2440587.5);
  // Align to VN calendar day stem/branch tradition
  const canIdx = ((jdn + 9) % 10 + 10) % 10;
  const chiIdx = ((jdn + 1) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}

export function canChiYear(lunarYear: number): string {
  const canIdx = ((lunarYear - 4) % 10 + 10) % 10;
  const chiIdx = ((lunarYear - 4) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}

export function canChiMonth(lunarYear: number, lunarMonth: number): string {
  const yearCan = ((lunarYear - 4) % 10 + 10) % 10;
  const canIdx = ((yearCan * 2 + lunarMonth) % 10 + 10) % 10;
  const chiIdx = ((lunarMonth + 1) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}

const GOOD_HOURS: Record<string, string[]> = {
  Tý: ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu'],
  Sửu: ['Dần', 'Mão', 'Tỵ', 'Thân', 'Tuất', 'Hợi'],
  Dần: ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu'],
  Mão: ['Tý', 'Sửu', 'Dần', 'Mão', 'Ngọ', 'Mùi'],
  Thìn: ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi'],
  Tỵ: ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi'],
  Ngọ: ['Tý', 'Sửu', 'Dần', 'Mão', 'Ngọ', 'Mùi'],
  Mùi: ['Dần', 'Mão', 'Tỵ', 'Ngọ', 'Thân', 'Tuất'],
  Thân: ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Thân', 'Dậu'],
  Dậu: ['Tý', 'Sửu', 'Dần', 'Mão', 'Ngọ', 'Mùi'],
  Tuất: ['Dần', 'Mão', 'Tỵ', 'Ngọ', 'Thân', 'Dậu'],
  Hợi: ['Sửu', 'Thìn', 'Ngọ', 'Mùi', 'Tuất', 'Hợi'],
};

export function getLunarDate(solar: Date = new Date()): LunarDate {
  const walk = walkLunar(solar);
  const dayCc = canChiDay(solar);
  const chiDay = dayCc.split(' ')[1] ?? 'Tý';
  const chiIdx = Math.max(0, CHI.indexOf(chiDay));
  const goodHours = GOOD_HOURS[chiDay] ?? ['Tý', 'Mão', 'Ngọ', 'Dậu'];
  const badHours = CHI.filter((h) => !goodHours.includes(h)).slice(0, 6);

  return {
    lunarDay: walk.d,
    lunarMonth: walk.m,
    lunarYear: walk.y,
    isLeap: walk.isLeap,
    canChiDay: dayCc,
    canChiMonth: canChiMonth(walk.y, walk.m),
    canChiYear: canChiYear(walk.y),
    zodiacDay: ZODIAC[chiIdx] ?? '',
    monthName: `${walk.isLeap ? 'Nhảy ' : ''}${LUNAR_MONTHS[walk.m - 1] ?? ''}`.trim(),
    goodHours,
    badHours,
  };
}

export function weekdayVi(d: Date): string {
  return WEEKDAYS[d.getDay()] ?? '';
}

export function formatSolarVi(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export { CHI, CAN, ZODIAC };
