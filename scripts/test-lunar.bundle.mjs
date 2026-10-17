// src/lunar.ts
var LUNAR_INFO = [
  19416,
  19168,
  42352,
  21717,
  53856,
  55632,
  91476,
  22176,
  39632,
  21970,
  19168,
  42422,
  42192,
  53840,
  119381,
  46400,
  54944,
  44450,
  38320,
  84343,
  18800,
  42160,
  46261,
  27216,
  27968,
  109396,
  11104,
  38256,
  21234,
  18800,
  25958,
  54432,
  59984,
  28309,
  23248,
  11104,
  100067,
  37600,
  116951,
  51536,
  54432,
  120998,
  46416,
  22176,
  107956,
  9680,
  37584,
  53938,
  43344,
  46423,
  27808,
  46416,
  86869,
  19872,
  42416,
  83315,
  21168,
  43432,
  59728,
  27296,
  44710,
  43856,
  19296,
  43748,
  42352,
  21088,
  62051,
  55632,
  23383,
  22176,
  38608,
  19925,
  19152,
  42192,
  54484,
  53840,
  54616,
  46400,
  46752,
  103846,
  38320,
  18864,
  43380,
  42160,
  45690,
  27216,
  27968,
  44870,
  43872,
  38256,
  19189,
  18800,
  25776,
  29859,
  59984,
  27480,
  23232,
  43872,
  38613,
  37600,
  51552,
  55636,
  54432,
  55888,
  30034,
  22176,
  43959,
  9680,
  37584,
  51893,
  43344,
  46240,
  47780,
  44368,
  21977,
  19360,
  42416,
  86390,
  21168,
  43312,
  31060,
  27296,
  44368,
  23378,
  19296,
  42726,
  42208,
  53856,
  60005,
  54576,
  23200,
  30371,
  38608,
  19195,
  19152,
  42192,
  118966,
  53840,
  54560,
  56645,
  46496,
  22224,
  21938,
  18864,
  42359,
  42160,
  43600,
  111189,
  27936,
  44448,
  84835,
  37744,
  18936,
  18800,
  25776,
  92326,
  59984,
  27424,
  108228,
  43744,
  41696,
  53987,
  51552,
  54615,
  54432,
  55888,
  23893,
  22176,
  42704,
  21972,
  21200,
  43448,
  43344,
  46240,
  46758,
  44368,
  21920,
  43940,
  42416,
  21168,
  45683,
  26928,
  29495,
  27296,
  44368,
  84821,
  19296,
  42352,
  21732,
  53600,
  59752,
  54560,
  55968,
  92838,
  22224,
  19168,
  43476,
  41680,
  53584,
  62034,
  54560
];
var CAN = ["Gi\xE1p", "\u1EA4t", "B\xEDnh", "\u0110inh", "M\u1EADu", "K\u1EF7", "Canh", "T\xE2n", "Nh\xE2m", "Qu\xFD"];
var CHI = ["T\xFD", "S\u1EEDu", "D\u1EA7n", "M\xE3o", "Th\xECn", "T\u1EF5", "Ng\u1ECD", "M\xF9i", "Th\xE2n", "D\u1EADu", "Tu\u1EA5t", "H\u1EE3i"];
var ZODIAC = ["Chu\u1ED9t", "Tr\xE2u", "H\u1ED5", "M\xE8o", "R\u1ED3ng", "R\u1EAFn", "Ng\u1EF1a", "D\xEA", "Kh\u1EC9", "G\xE0", "Ch\xF3", "L\u1EE3n"];
var LUNAR_MONTHS = [
  "Th\xE1ng Gi\xEAng",
  "Th\xE1ng Hai",
  "Th\xE1ng Ba",
  "Th\xE1ng T\u01B0",
  "Th\xE1ng N\u0103m",
  "Th\xE1ng S\xE1u",
  "Th\xE1ng B\u1EA3y",
  "Th\xE1ng T\xE1m",
  "Th\xE1ng Ch\xEDn",
  "Th\xE1ng M\u01B0\u1EDDi",
  "Th\xE1ng M\u1ED9t",
  "Th\xE1ng Ch\u1EA1p"
];
function info(y) {
  return LUNAR_INFO[y - 1900] ?? 19416;
}
function leapMonth(y) {
  return info(y) & 15;
}
function leapDays(y) {
  if (!leapMonth(y)) return 0;
  return info(y) & 65536 ? 30 : 29;
}
function monthDays(y, m) {
  return info(y) & 65536 >> m ? 30 : 29;
}
function yearDays(y) {
  let sum = 348;
  for (let i = 32768; i > 8; i >>= 1) {
    if (info(y) & i) sum += 1;
  }
  return sum + leapDays(y);
}
function walkLunar(solar) {
  let offset = Math.round(
    (Date.UTC(solar.getFullYear(), solar.getMonth(), solar.getDate()) - Date.UTC(1900, 0, 31)) / 864e5
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
function canChiDay(date) {
  const jdn = Math.floor(date.getTime() / 864e5 + 24405875e-1);
  const canIdx = ((jdn + 9) % 10 + 10) % 10;
  const chiIdx = ((jdn + 1) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}
function canChiYear(lunarYear) {
  const canIdx = ((lunarYear - 4) % 10 + 10) % 10;
  const chiIdx = ((lunarYear - 4) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}
function canChiMonth(lunarYear, lunarMonth) {
  const yearCan = ((lunarYear - 4) % 10 + 10) % 10;
  const canIdx = ((yearCan * 2 + lunarMonth) % 10 + 10) % 10;
  const chiIdx = ((lunarMonth + 1) % 12 + 12) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}
var GOOD_HOURS = {
  T\u00FD: ["T\xFD", "S\u1EEDu", "M\xE3o", "Ng\u1ECD", "Th\xE2n", "D\u1EADu"],
  S\u1EEDu: ["D\u1EA7n", "M\xE3o", "T\u1EF5", "Th\xE2n", "Tu\u1EA5t", "H\u1EE3i"],
  D\u1EA7n: ["T\xFD", "S\u1EEDu", "M\xE3o", "Ng\u1ECD", "Th\xE2n", "D\u1EADu"],
  M\u00E3o: ["T\xFD", "S\u1EEDu", "D\u1EA7n", "M\xE3o", "Ng\u1ECD", "M\xF9i"],
  Th\u00ECn: ["D\u1EA7n", "Th\xECn", "T\u1EF5", "Th\xE2n", "D\u1EADu", "H\u1EE3i"],
  T\u1EF5: ["S\u1EEDu", "Th\xECn", "Ng\u1ECD", "M\xF9i", "Tu\u1EA5t", "H\u1EE3i"],
  Ng\u1ECD: ["T\xFD", "S\u1EEDu", "D\u1EA7n", "M\xE3o", "Ng\u1ECD", "M\xF9i"],
  M\u00F9i: ["D\u1EA7n", "M\xE3o", "T\u1EF5", "Ng\u1ECD", "Th\xE2n", "Tu\u1EA5t"],
  Th\u00E2n: ["T\xFD", "S\u1EEDu", "Th\xECn", "T\u1EF5", "Th\xE2n", "D\u1EADu"],
  D\u1EADu: ["T\xFD", "S\u1EEDu", "D\u1EA7n", "M\xE3o", "Ng\u1ECD", "M\xF9i"],
  Tu\u1EA5t: ["D\u1EA7n", "M\xE3o", "T\u1EF5", "Ng\u1ECD", "Th\xE2n", "D\u1EADu"],
  H\u1EE3i: ["S\u1EEDu", "Th\xECn", "Ng\u1ECD", "M\xF9i", "Tu\u1EA5t", "H\u1EE3i"]
};
function getLunarDate(solar = /* @__PURE__ */ new Date()) {
  const walk = walkLunar(solar);
  const dayCc = canChiDay(solar);
  const chiDay = dayCc.split(" ")[1] ?? "T\xFD";
  const chiIdx = Math.max(0, CHI.indexOf(chiDay));
  const goodHours = GOOD_HOURS[chiDay] ?? ["T\xFD", "M\xE3o", "Ng\u1ECD", "D\u1EADu"];
  const badHours = CHI.filter((h) => !goodHours.includes(h)).slice(0, 6);
  return {
    lunarDay: walk.d,
    lunarMonth: walk.m,
    lunarYear: walk.y,
    isLeap: walk.isLeap,
    canChiDay: dayCc,
    canChiMonth: canChiMonth(walk.y, walk.m),
    canChiYear: canChiYear(walk.y),
    zodiacDay: ZODIAC[chiIdx] ?? "",
    monthName: `${walk.isLeap ? "Nh\u1EA3y " : ""}${LUNAR_MONTHS[walk.m - 1] ?? ""}`.trim(),
    goodHours,
    badHours
  };
}

// scripts/test-lunar.mjs
var cases = [
  { label: "Tet 2024-02-10", d: new Date(2024, 1, 10), expect: { y: 2024, m: 1, d: 1 } },
  { label: "Tet 2025-01-29", d: new Date(2025, 0, 29), expect: { y: 2025, m: 1, d: 1 } },
  { label: "2025-08-23", d: new Date(2025, 7, 23), expect: { y: 2025, m: 7, d: 1 } },
  { label: "today", d: /* @__PURE__ */ new Date() }
];
for (const c of cases) {
  const l = getLunarDate(c.d);
  console.log(c.label, "=>", l.lunarDay, "/", l.lunarMonth, "year", l.lunarYear, l.isLeap ? "(leap)" : "", l.canChiDay, l.canChiYear);
  if (c.expect) {
    const ok = l.lunarYear === c.expect.y && l.lunarMonth === c.expect.m && l.lunarDay === c.expect.d;
    console.log("  expected", c.expect, ok ? "OK" : "FAIL");
  }
}
console.log("canChiYear 2024", canChiYear(2024), "canChiDay 2000-01-01", canChiDay(new Date(2e3, 0, 1)));
