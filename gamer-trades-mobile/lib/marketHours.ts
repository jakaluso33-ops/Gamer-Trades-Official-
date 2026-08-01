import { AssetClass } from './symbols';

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getEasternParts(date: Date): { dayIdx: number; minutesOfDay: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);
  return { dayIdx: DAY_ORDER.indexOf(map.weekday), minutesOfDay: hour * 60 + minute };
}

/**
 * Real (simplified) trading-session hours per asset class, in Eastern Time —
 * no holiday calendar. Crypto trades 24/7; forex/futures run a near-continuous
 * Sun evening–Fri evening week; stocks/indices/options follow the NYSE regular session.
 */
export function isMarketOpen(assetClass: AssetClass, now: Date = new Date()): boolean {
  if (assetClass === 'CRYPTO') return true;

  const { dayIdx, minutesOfDay } = getEasternParts(now);

  if (assetClass === 'FOREX' || assetClass === 'FUTURES') {
    if (dayIdx === 0) return minutesOfDay >= 18 * 60; // Sunday, opens 6pm ET
    if (dayIdx === 6) return false; // Saturday, closed
    if (dayIdx === 5) return minutesOfDay < 17 * 60; // Friday, closes 5pm ET
    return true; // Monday-Thursday, open around the clock
  }

  // STOCK, INDEX, OPTIONS — NYSE regular session, Mon-Fri 9:30am-4:00pm ET
  if (dayIdx === 0 || dayIdx === 6) return false;
  return minutesOfDay >= 9 * 60 + 30 && minutesOfDay < 16 * 60;
}
