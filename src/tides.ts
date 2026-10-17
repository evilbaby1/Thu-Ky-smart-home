import type { TideEvent } from './types';

/**
 * Simplified tidal model for Sài Gòn / Vũng Tàu approaches.
 * Semidiurnal M2 + S2 constituents with approximate amplitudes (meters
 * above chart datum) and a mild spring-neap cycle. Good enough for a
 * glanceable home dashboard; swap for a real station API later.
 */
const M2_AMP = 1.35; // principal lunar semidiurnal
const S2_AMP = 0.35; // principal solar semidiurnal
const MEAN = 1.55; // mean sea level-ish
const M2_PERIOD_H = 12.4206;
const S2_PERIOD_H = 12.0;
// Phase references calibrated loosely to VN timezone
const M2_PHASE = 1.1;
const S2_PHASE = 2.4;

export function tideHeightAt(t: Date): number {
  const hours = t.getTime() / 3600000;
  const m2 = M2_AMP * Math.sin((2 * Math.PI * hours) / M2_PERIOD_H + M2_PHASE);
  const s2 = S2_AMP * Math.sin((2 * Math.PI * hours) / S2_PERIOD_H + S2_PHASE);
  return MEAN + m2 + s2;
}

export function tideForecast(from: Date = new Date(), hoursAhead = 48): TideEvent[] {
  const events: TideEvent[] = [];
  const stepMin = 10;
  const steps = Math.ceil((hoursAhead * 60) / stepMin);
  let prevH = tideHeightAt(from);
  let prevPrevH = prevH;

  for (let i = 1; i <= steps; i++) {
    const t = new Date(from.getTime() + i * stepMin * 60000);
    const h = tideHeightAt(t);
    // local extremum
    if (i > 1) {
      if (prevH > prevPrevH && prevH > h) {
        events.push({ time: new Date(t.getTime() - stepMin * 60000), height: prevH, kind: 'high' });
      } else if (prevH < prevPrevH && prevH < h) {
        events.push({ time: new Date(t.getTime() - stepMin * 60000), height: prevH, kind: 'low' });
      }
    }
    prevPrevH = prevH;
    prevH = h;
    if (events.length >= 8) break;
  }
  return events;
}

export function tidePoints(from: Date = new Date(), hoursAhead = 24, everyMin = 30) {
  const pts: Array<{ t: Date; h: number }> = [];
  const steps = Math.ceil((hoursAhead * 60) / everyMin);
  for (let i = 0; i <= steps; i++) {
    const t = new Date(from.getTime() + i * everyMin * 60000);
    pts.push({ t, h: tideHeightAt(t) });
  }
  return pts;
}

export function formatHourVi(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
