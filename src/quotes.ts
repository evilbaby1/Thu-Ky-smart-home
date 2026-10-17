export interface FolkQuote {
  text: string;
  kind: 'Ca dao' | 'Thành ngữ' | 'Tục ngữ';
  gloss?: string;
}

/** Ca dao / thành ngữ / tục ngữ — khích lệ tinh thần */
export const FOLK_QUOTES: FolkQuote[] = [
  { text: 'Có công mài sắt, có ngày nên kim.', kind: 'Tục ngữ', gloss: 'Kiên trì rèn luyện, ắt thành công.' },
  { text: 'Chớ thấy sóng cả mà ngã tay chèo.', kind: 'Tục ngữ', gloss: 'Khó khăn không được nản lòng.' },
  { text: 'Đi một ngày đàng, học một sàng khôn.', kind: 'Tục ngữ', gloss: 'Ra đời là để mở mang trí tuệ.' },
  { text: 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.', kind: 'Ca dao', gloss: 'Đoàn kết tạo nên sức mạnh.' },
  { text: 'Trời sinh voi, trời sinh cỏ.', kind: 'Tục ngữ', gloss: 'Luôn có lối đi cho người biết cố gắng.' },
  { text: 'Đói cho sạch, rách cho thơm.', kind: 'Tục ngữ', gloss: 'Nghèo khó vẫn giữ phẩm giá.' },
  { text: 'Học ăn, học nói, học gói, học mở.', kind: 'Tục ngữ', gloss: 'Không ngừng học hỏi mỗi ngày.' },
  { text: 'Tấc đất tấc vàng.', kind: 'Thành ngữ', gloss: 'Trân trọng những gì mình đang có.' },
  { text: 'Uống nước nhớ nguồn.', kind: 'Tục ngữ', gloss: 'Sống biết ơn cội nguồn, cha mẹ, thầy cô.' },
  { text: 'Thương người như thể thương thân.', kind: 'Tục ngữ', gloss: 'Lòng nhân ái bắt đầu từ sự đồng cảm.' },
  { text: 'Gần mực thì đen, gần đèn thì rạng.', kind: 'Tục ngữ', gloss: 'Chọn môi trường tốt để lớn lên.' },
  { text: 'Không có việc gì khó, chỉ sợ lòng không bền.', kind: 'Tục ngữ', gloss: 'Ý chí quyết định thành bại.' },
  { text: 'Dẫu xây chín đợt phù sa, không bằng khen một lời cha mẹ hiền.', kind: 'Ca dao', gloss: 'Lời động viên của người thân quý hơn vàng.' },
  { text: 'Đèn nhà ai nấy rạng.', kind: 'Tục ngữ', gloss: 'Lo tốt việc nhà, vun vén hạnh phúc nhỏ.' },
  { text: 'Tự lực cánh sinh.', kind: 'Thành ngữ', gloss: 'Nỗ lực bằng chính sức của mình.' },
  { text: 'Góp gió thành bão.', kind: 'Thành ngữ', gloss: 'Việc nhỏ lặp lại sẽ thành việc lớn.' },
  { text: 'Đi chậm còn hơn đứng yên.', kind: 'Thành ngữ', gloss: 'Mỗi ngày tiến một chút là đủ.' },
  { text: 'Trăm hay không bằng tay quen.', kind: 'Tục ngữ', gloss: 'Làm nhiều sẽ thành thạo.' },
  { text: 'Cá không ăn muối cá ươn, con cãi mẹ cha trăm đường con hư.', kind: 'Ca dao', gloss: 'Giữ đạo hiếu là giữ gốc.' },
  { text: 'Ở hiền gặp lành.', kind: 'Tục ngữ', gloss: 'Sống tốt, điều tốt sẽ quay về.' },
  { text: 'Một bữa no bằng một gói cần.', kind: 'Tục ngữ', gloss: 'Sức khỏe là tài sản quý nhất.' },
  { text: 'Tu nhân tích đức.', kind: 'Thành ngữ', gloss: 'Ngày ngày làm điều thiện, tích phước lâu dài.' },
  { text: 'Xanh vỏ đỏ lòng.', kind: 'Thành ngữ', gloss: 'Đừng nhìn bề ngoài mà vội phán xét.' },
  { text: 'Thắng không kiêu, bại không nản.', kind: 'Thành ngữ', gloss: 'Giữ tâm bình giữa thăng trầm.' },
  { text: 'Mỗi ngày một chút, khoa học đến nhà.', kind: 'Ca dao', gloss: 'Học hỏi đều đặn sẽ đổi đời.' },
];

/** Deterministic pick by day, or random-ish rotation index. */
export function quoteOfTheDay(date: Date = new Date()): FolkQuote {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  return FOLK_QUOTES[dayIndex % FOLK_QUOTES.length]!;
}

export function quoteAt(index: number): FolkQuote {
  const i = ((index % FOLK_QUOTES.length) + FOLK_QUOTES.length) % FOLK_QUOTES.length;
  return FOLK_QUOTES[i]!;
}

export function todayQuoteIndex(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86400000) % FOLK_QUOTES.length;
}
