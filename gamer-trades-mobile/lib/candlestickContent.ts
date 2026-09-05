import { CandlePatternId } from './candlePatterns';

export interface CandlePatternInfo {
  id: CandlePatternId;
  name: string;
  icon: string;
  color: string;
  candleCount: 1 | 2;
  summary: string;
  appearance: string[];
  whatItIndicates: string;
  reliabilityNote: string;
  example: string;
}

export const CANDLE_PATTERNS: CandlePatternInfo[] = [
  {
    id: 'hammer',
    name: 'HAMMER',
    icon: '🔨',
    color: '#00ff88',
    candleCount: 1,
    summary: 'A single-candle bullish reversal signal that forms after a decline.',
    appearance: [
      'Small body near the TOP of the candle\'s range.',
      'A long lower wick — at least twice the length of the body.',
      'Little to no upper wick.',
      'Only means anything if it forms after a clear downtrend — the same shape mid-range is just noise.',
    ],
    whatItIndicates: 'Sellers pushed price sharply lower during the period, but buyers stepped in hard and drove it back up near the open — a real fight that buyers won. It suggests selling pressure may be exhausting.',
    reliabilityNote: 'A hammer alone is a caution flag, not a trigger. Most traders wait for the NEXT candle to close higher (confirmation) before treating it as an actual reversal.',
    example: 'A stock falls for five straight sessions, then prints a candle that dips 4% intraday but closes almost flat with a long lower wick — a hammer. The next day it gaps up and closes green, confirming the reversal.',
  },
  {
    id: 'inverted_hammer',
    name: 'INVERTED HAMMER',
    icon: '🔨',
    color: '#00aaff',
    candleCount: 1,
    summary: 'The upside-down version of a hammer — same idea, opposite wick, still bullish.',
    appearance: [
      'Small body near the BOTTOM of the candle\'s range.',
      'A long upper wick — at least twice the length of the body.',
      'Little to no lower wick.',
      'Forms after a downtrend, same as a hammer.',
    ],
    whatItIndicates: 'Buyers tried to push price up sharply during the period and mostly succeeded in testing higher ground, even though it closed back near the open. It\'s an early, tentative sign that buying interest is returning.',
    reliabilityNote: 'Weaker than a regular hammer on its own — the failure to close near the highs means sellers still had the last word that candle. Confirmation on the next candle matters even more here.',
    example: 'A currency pair grinds lower for a week, then one candle wicks up 0.8% intraday before closing flat — an inverted hammer. Traders watch the next candle for a follow-through close higher.',
  },
  {
    id: 'hanging_man',
    name: 'HANGING MAN',
    icon: '⚠️',
    color: '#ff3355',
    candleCount: 1,
    summary: 'The exact same shape as a hammer, but bearish — context (an uptrend) is everything.',
    appearance: [
      'Small body near the TOP of the range.',
      'A long lower wick, at least twice the body.',
      'Little to no upper wick.',
      'Only counts as a hanging man after an UPTREND — this is what separates it from a hammer.',
    ],
    whatItIndicates: 'Even in a rally, sellers were able to push price down sharply intraday before buyers rescued it. That\'s a crack in what looked like one-sided control — a warning sign the advance may be losing steam.',
    reliabilityNote: 'Like a hammer, needs confirmation — a lower close on the next candle. Many hanging men resolve into nothing if the uptrend simply resumes.',
    example: 'A stock rallies for two weeks straight, then one session sells off 3% intraday before recovering to close flat — a hanging man. If the next day closes red too, that\'s the confirmation bears were looking for.',
  },
  {
    id: 'shooting_star',
    name: 'SHOOTING STAR',
    icon: '🌠',
    color: '#ff3355',
    candleCount: 1,
    summary: 'The bearish twin of an inverted hammer — forms at the top of an advance.',
    appearance: [
      'Small body near the BOTTOM of the range.',
      'A long upper wick, at least twice the body.',
      'Little to no lower wick.',
      'Forms after an UPTREND — the same shape in a downtrend is just an inverted hammer.',
    ],
    whatItIndicates: 'Buyers pushed price to a new high intraday, but sellers overwhelmed them and drove it all the way back down near the open. That rejection at the highs is a classic sign of exhausted buying pressure.',
    reliabilityNote: 'One of the more reliable single-candle reversal signals when it forms right at a resistance level or round number — the rejection has an obvious "why."',
    example: 'A crypto asset spikes to a new all-time high on the open, wicks up another 5%, then closes back near where it started — a shooting star sitting right at a psychological price level.',
  },
  {
    id: 'doji',
    name: 'DOJI',
    icon: '➕',
    color: '#ffd700',
    candleCount: 1,
    summary: 'Open and close land almost exactly together — pure indecision, not a directional signal by itself.',
    appearance: [
      'The body is a thin sliver — open and close are nearly identical.',
      'Wick length above and below can vary a lot (long-legged doji, dragonfly, gravestone are all variants).',
      'Can appear in any trend, at any point — its meaning changes entirely based on where it shows up.',
    ],
    whatItIndicates: 'Neither buyers nor sellers won the period — it ended almost exactly where it started despite whatever happened in between. A doji after a strong, one-sided trend is a much bigger deal than one in a choppy, directionless market.',
    reliabilityNote: 'A doji is a QUESTION, not an answer. Never trade a doji in isolation — it only becomes meaningful combined with where it forms (after a strong trend, at a key level) and what the next candle does.',
    example: 'After a six-day rally, a stock opens, trades in a wide range all day, and closes within a penny of its open — a doji signaling the one-sided buying may be pausing, even before any reversal is confirmed.',
  },
  {
    id: 'bullish_engulfing',
    name: 'BULLISH ENGULFING',
    icon: '🟢',
    color: '#00ff88',
    candleCount: 2,
    summary: 'A two-candle reversal where a big green candle completely swallows the prior red one.',
    appearance: [
      'First candle: red (closed lower than it opened).',
      'Second candle: green, and its body fully covers the first candle\'s entire body — opens at or below the prior close, closes at or above the prior open.',
      'More significant after a clear downtrend.',
    ],
    whatItIndicates: 'A decisive shift in control within a single candle — buyers didn\'t just stop the decline, they erased the whole previous candle\'s move and then some. Generally considered stronger and more actionable than a single-candle hammer.',
    reliabilityNote: 'Higher volume on the engulfing candle meaningfully strengthens the signal — a low-volume engulfing pattern is much easier to fade.',
    example: 'A stock drops 2% one day (red candle), then opens below that low and rallies to close 3% above the prior day\'s open (green candle fully engulfing it) — a textbook bullish engulfing pattern.',
  },
  {
    id: 'bearish_engulfing',
    name: 'BEARISH ENGULFING',
    icon: '🔴',
    color: '#ff3355',
    candleCount: 2,
    summary: 'The mirror image — a big red candle completely swallows the prior green one.',
    appearance: [
      'First candle: green (closed higher than it opened).',
      'Second candle: red, and its body fully covers the first candle\'s entire body — opens at or above the prior close, closes at or below the prior open.',
      'More significant after a clear uptrend.',
    ],
    whatItIndicates: 'Sellers overwhelmed an entire prior period of buying in one move — a strong signal that momentum has flipped, especially near resistance or after an extended run-up.',
    reliabilityNote: 'Same rule as bullish engulfing — watch volume. A bearish engulfing candle on light volume is a much weaker signal than one on a volume spike.',
    example: 'A crypto asset grinds up for days, then one candle opens above the prior close and sells off to close below the prior open on heavy volume — a bearish engulfing pattern right as the rally stalls.',
  },
  {
    id: 'marubozu',
    name: 'MARUBOZU',
    icon: '🟩',
    color: '#8b5cf6',
    candleCount: 1,
    summary: 'A candle that is almost all body, almost no wick — one side was in total control the whole period.',
    appearance: [
      'The body takes up nearly the entire high-to-low range.',
      'Virtually no upper or lower wick.',
      'Bullish marubozu: opens at (or near) the low, closes at (or near) the high. Bearish: the reverse.',
    ],
    whatItIndicates: 'Uninterrupted, one-directional conviction for the entire period — no meaningful pushback from the other side at any point. Often shows up at the start of strong trending moves or on major news.',
    reliabilityNote: 'A marubozu is a momentum signal, not a reversal one — it usually favors continuation in its own direction, not against it, unless it appears after an already-extended move (where it can mark exhaustion instead).',
    example: 'Earnings beat expectations before the open; the stock opens near its low for the day and grinds up in a straight line to close at its high — a bullish marubozu reflecting one-sided conviction all session.',
  },
];

export function getCandlePattern(id: string): CandlePatternInfo | undefined {
  return CANDLE_PATTERNS.find(p => p.id === id);
}
