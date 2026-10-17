import { getLunarDate, canChiDay } from './lunar';

export interface FortuneReading {
  title: string;
  emoji: string;
  summary: string;
  score: number; // 0-100
  luckyColor: string;
  luckyNumber: number;
  advice: string;
  luckyHours: string[];
  unluckyHours: string[];
}

const TITLES = [
  'Cát lợi hanh thông',
  'Bình an vô sự',
  'Cần thận một chút',
  'Thời đến rồi',
  'Giữ lòng an yên',
  'Hợp duyên trợ lực',
  'Chậm mà chắc',
  'Khởi sắc nhẹ nhàng',
  'Tránh tranh chấp',
  'Năng lượng dồi dào',
];

const ADVICE = [
  'Hôm nay hợp bắt đầu việc nhỏ, tránh quyết định lớn về tiền bạc.',
  'Nên gặp gỡ bạn bè, mở lòng trò chuyện — quý nhân ở gần.',
  'Giữ nhịp sống đều, uống đủ nước, hạn chế thức khuya.',
  'Việc nhà cửa, bếp núc thuận lợi; có thể dọn dẹp đón sinh khí.',
  'Tập trung vào một mục tiêu chính, không ôm đồm quá nhiều.',
  'Hợp học hỏi, đọc sách, lên kế hoạch cho tuần tới.',
  'Tránh vay mượn và hứa hẹn khi chưa chắc chắn.',
  'Nên vận động nhẹ ngoài trời, đón nắng sớm.',
  'Tin vui có thể đến từ người thân trong nhà.',
  'Thiền tĩnh tâm 10 phút sẽ giúp ngày suôn sẻ hơn.',
];

const COLORS = [
  { name: 'Đỏ son', hex: '#D64545' },
  { name: 'Vàng đồng', hex: '#E4B363' },
  { name: 'Xanh ngọc', hex: '#3DB8A8' },
  { name: 'Tím nhạt', hex: '#9B7EDE' },
  { name: 'Cam gạch', hex: '#E07A5F' },
  { name: 'Xanh rêu', hex: '#6B9080' },
  { name: 'Trắng ngà', hex: '#E8EEF7' },
  { name: 'Nâu trầm', hex: '#A67C52' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getFortune(date: Date = new Date()): FortuneReading {
  const lunar = getLunarDate(date);
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${lunar.canChiDay}`;
  const h = hashStr(key);

  const title = TITLES[h % TITLES.length]!;
  const advice = ADVICE[(h >>> 3) % ADVICE.length]!;
  const color = COLORS[(h >>> 5) % COLORS.length]!;
  const score = 55 + (h % 41); // 55-95
  const luckyNumber = 1 + (h % 9);

  const emojiMap: Record<string, string> = {
    'Cát lợi hanh thông': '✨',
    'Bình an vô sự': '🕊️',
    'Cần thận một chút': '⚠️',
    'Thời đến rồi': '🚀',
    'Giữ lòng an yên': '🧘',
    'Hợp duyên trợ lực': '🤝',
    'Chậm mà chắc': '🐢',
    'Khởi sắc nhẹ nhàng': '🌱',
    'Tránh tranh chấp': '🛡️',
    'Năng lượng dồi dào': '⚡',
  };

  return {
    title,
    emoji: emojiMap[title] ?? '🔮',
    summary: `Ngày ${lunar.canChiDay}, tháng ${lunar.canChiMonth}, năm ${lunar.canChiYear}.`,
    score,
    luckyColor: color.name,
    luckyNumber,
    advice,
    luckyHours: lunar.goodHours,
    unluckyHours: lunar.badHours,
  };
}

export function getHourFortune(date: Date = new Date()): { label: string; good: boolean } {
  const chiIdx = Math.floor(date.getHours() / 2);
  const chis = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const label = chis[chiIdx] ?? 'Tý';
  const lunar = getLunarDate(date);
  return { label, good: lunar.goodHours.includes(label) };
}

export { canChiDay };
