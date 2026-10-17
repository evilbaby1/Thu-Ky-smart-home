/** Diacritic-safe helpers that work on Android 6 WebView (no \p{Diacritic}). */

/** Lowercase + strip Vietnamese diacritics + đ→d. */
export function stripVi(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/** Same as stripVi but also collapses punctuation to spaces. */
export function normalizeCommand(s: string): string {
  return stripVi(s)
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
