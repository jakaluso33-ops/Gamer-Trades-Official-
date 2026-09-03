export type StrategyDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface StrategyInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  difficulty: StrategyDifficulty;
  summary: string;
  howItWorks: string[];
  entryRules: string[];
  exitRules: string[];
  commonMistakes: string[];
  example: string;
  whenToUse: string;
  riskNote: string;
  /** Among the most commonly used/discussed strategies by retail traders -- shown with a
   * "🔥 POPULAR" badge. Independent of provenProfitable -- popularity and rigorous proof
   * of edge are two different things, which is exactly why both are labeled separately. */
  popular?: boolean;
  /** Strategies with a genuinely rigorous, long-documented track record of profitability
   * (decades of live fund performance, or peer-reviewed academic evidence) rather than just
   * being widely used. Gated to Pro/Legend -- both the full write-up here and live detection
   * on the Trade Desk / Master Trader Scanner. */
  provenProfitable?: boolean;
}

export const STRATEGIES: StrategyInfo[] = [
  {
    id: 'breakout',
    name: 'BREAKOUT TRADING',
    icon: '🚀',
    color: '#00ff88',
    difficulty: 'BEGINNER',
    summary: 'Enter when price pushes decisively through a well-established support or resistance level.',
    howItWorks: [
      'Identify a price level that has been tested multiple times without breaking (resistance above, support below).',
      'Wait for a candle to close beyond that level, not just wick through it.',
      'Confirm with above-average volume — a breakout on low volume is more likely to fail.',
      'Enter in the direction of the break; the old resistance often becomes new support (and vice versa).',
    ],
    entryRules: [
      'Mark the level after at least 2-3 clean prior tests (touches that reversed without breaking).',
      'Wait for a full candle CLOSE beyond the level — a wick alone is not confirmation.',
      'Check volume on the breakout candle: it should be visibly higher than the recent average.',
      'Enter on the close of the breakout candle, or on a retest of the broken level holding as new support/resistance.',
    ],
    exitRules: [
      'Initial stop-loss just inside the old range, beyond the broken level — if price falls back through, the breakout has likely failed.',
      'A common target is the height of the prior range projected from the breakout point (a "measured move").',
      'Trail the stop as the move extends, to lock in gains rather than giving back the whole move on a reversal.',
    ],
    commonMistakes: [
      'Entering on the first wick through the level instead of waiting for a confirmed close.',
      'Ignoring volume — a breakout on thin volume fails far more often than it succeeds.',
      'Chasing price too far after the breakout candle has already closed, leaving a poor risk/reward on the stop.',
    ],
    example: 'A stock coils under $50 resistance for two weeks, testing it three times without breaking. On the fourth test, it closes at $50.80 on volume 2x the daily average. A trader enters at the close, with a stop at $49.50 (back inside the old range) and a first target near $53 — the approximate height of the prior consolidation projected upward.',
    whenToUse: 'Best in trending or consolidating markets that are coiling near a clear range boundary.',
    riskNote: 'Watch for "fakeouts" — a quick break that reverses. A stop just back inside the old range limits the damage.',
    popular: true,
  },
  {
    id: 'orb',
    name: 'OPENING RANGE BREAKOUT (ORB)',
    icon: '🔔',
    color: '#00aaff',
    difficulty: 'INTERMEDIATE',
    summary: "Trade the breakout of the range set in a market's first few minutes of activity.",
    howItWorks: [
      'Mark the high and low of the first N candles after the session/period opens — this is the "opening range".',
      'Wait for price to close outside that range, up or down.',
      'A break above the range high signals bullish momentum; a break below the range low signals bearish momentum.',
      'The size of the opening range often predicts the size of the move — a tight range can lead to an explosive breakout.',
    ],
    entryRules: [
      'Define the opening range window in advance (commonly the first 5, 15, or 30 minutes) and stay consistent with it.',
      'Wait for a candle close beyond the range high or low, not just an intra-candle poke through it.',
      'Many traders wait specifically for a retest of the broken range edge to hold, rather than entering on the initial break.',
      'Favor ORB setups where the opening range itself is relatively tight — a wide, chaotic opening range gives a lower-quality signal.',
    ],
    exitRules: [
      'Initial stop typically goes at the opposite side of the opening range.',
      'A common first target equals the height of the opening range, measured from the breakout point.',
      'Because ORB trades often happen early in high-volatility hours, tightening stops or taking partial profits sooner than usual is common.',
    ],
    commonMistakes: [
      'Trading every single ORB signal regardless of the broader daily trend or context from the prior session.',
      'Using an opening range window that\'s too short (like 1 minute), which produces mostly noise.',
      'Holding through the inevitable early-session chop instead of respecting the initial stop.',
    ],
    example: 'A crypto pair opens a new 4-hour session and trades between $1,980 and $2,000 in the first 15 minutes — that\'s the opening range. Price then closes at $2,006, breaking the range high. A trader enters near that close, stops just under $2,000 (the range low), and targets roughly $2,026 — the $20 range height projected above the breakout.',
    whenToUse: 'Popular for the first hour of a trading session when volatility and volume are highest.',
    riskNote: 'Early session moves can be choppy. Many traders wait for a retest of the range edge before entering.',
  },
  {
    id: 'fibonacci',
    name: 'FIBONACCI RETRACEMENT',
    icon: '🌀',
    color: '#ffd700',
    difficulty: 'INTERMEDIATE',
    summary: 'Use natural ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%) to find likely pullback levels within a trend.',
    howItWorks: [
      'Identify a clear swing — a recent significant high and low.',
      'Draw retracement levels between that swing high and low.',
      'Watch for price to pull back to one of the key levels (38.2%, 50%, or 61.8% are the most-watched).',
      'A bounce or rejection at one of these levels, especially with other confirmation, can signal a continuation of the original trend.',
    ],
    entryRules: [
      'Anchor the tool on the most recent, cleanest impulse swing — a messy or ambiguous swing produces unreliable levels.',
      'Wait for price to actually reach a key level (38.2%, 50%, or 61.8%), not just approach it.',
      'Look for a confirming candlestick signal at the level (rejection wick, bullish/bearish reversal candle) rather than entering purely because price touched the line.',
      'Combining a Fib level with a separate support/resistance zone at roughly the same price ("confluence") meaningfully raises the quality of the signal.',
    ],
    exitRules: [
      'Stop-loss typically goes just beyond the next Fib level down (for a long) or up (for a short) from the entry.',
      'A common first target is the prior swing high (for a long entry) or swing low (for a short) — i.e. a full retest of the move that started the retracement.',
      'If price blows through the 61.8%-78.6% zone without holding, that\'s a sign the "retracement" may actually be turning into a full trend reversal — treat it as invalidation, not just a deeper pullback.',
    ],
    commonMistakes: [
      'Drawing Fibonacci on a poorly defined or very short swing, producing levels that don\'t mean much.',
      'Entering the instant price touches a level instead of waiting for a confirming candle.',
      'Assuming every retracement will hold — sometimes the trend has genuinely ended, and this is the first leg of a new one.',
    ],
    example: 'A forex pair rallies from 1.0800 to 1.1000, then starts pulling back. The 61.8% retracement of that swing sits near 1.0876. Price pulls back to 1.0880, prints a bullish rejection candle, and a trader enters long there, with a stop below the 78.6% level (~1.0843) and a target back at the prior high, 1.1000.',
    whenToUse: 'Works best in a strong, established trend that is pulling back rather than reversing.',
    riskNote: "Fib levels are self-fulfilling because many traders watch them — but they're not guaranteed support. Combine with other signals.",
  },
  {
    id: 'support_resistance',
    name: 'SUPPORT & RESISTANCE',
    icon: '📏',
    color: '#8b5cf6',
    difficulty: 'BEGINNER',
    summary: 'Trade the bounces (or breaks) at price levels the market has repeatedly respected.',
    howItWorks: [
      'Look for price levels where the market has reversed direction two or more times.',
      'The more times a level is tested, the more significant it becomes — but each test also slightly weakens it.',
      'Buy near well-tested support, sell/short near well-tested resistance, with a tight stop beyond the level.',
      'If the level finally breaks, it often flips roles — old resistance becomes new support.',
    ],
    entryRules: [
      'Mark levels using the wicks/bodies of at least two prior reversals, not just one touch.',
      'Wait for price to actually arrive back at the level and show a rejection candle before entering — don\'t pre-place an order purely on the line itself unless you fully accept the risk of a clean break.',
      'Give the level room — treat it as a zone (a small price range), not a single exact price.',
      'Higher-timeframe support/resistance levels generally carry more weight than ones drawn on a 1-minute chart.',
    ],
    exitRules: [
      'Stop just beyond the far side of the zone — enough room to avoid being stopped out by normal noise, tight enough to cut losses if the level truly fails.',
      'First target is usually the opposite boundary of the current range (support entry → target the resistance above, and vice versa).',
      'If the level breaks with a strong close and volume, exit rather than hoping it snaps back — the "old resistance becomes new support" flip is common, but not guaranteed on every break.',
    ],
    commonMistakes: [
      'Treating a level as an exact price rather than a zone, leading to stops that get clipped by normal wicks.',
      'Fading (trading against) a level that has already broken cleanly, rather than respecting the new trend.',
      'Drawing too many levels on a chart, diluting which ones actually matter.',
    ],
    example: 'A stock has bounced off $120 support three separate times over a month. On the fourth approach, price wicks down to $119.60 and closes back at $121.30 with a long lower wick. A trader buys near the close, stops at $118.50 (below the zone), and targets $128 — the resistance at the top of the recent range.',
    whenToUse: 'Useful in range-bound markets, and as context for almost every other strategy.',
    riskNote: 'Levels are zones, not exact prices. Give trades room rather than using a razor-thin stop right at the line.',
    popular: true,
  },
  {
    id: 'ma_crossover',
    name: 'MOVING AVERAGE CROSSOVER',
    icon: '✂️',
    color: '#ff8800',
    difficulty: 'BEGINNER',
    summary: 'Trade the trend change signaled when a fast moving average crosses a slower one.',
    howItWorks: [
      'Plot a fast moving average (e.g. 9-period) and a slow moving average (e.g. 21-period).',
      'A "golden cross" — fast crossing above slow — signals emerging bullish momentum.',
      'A "death cross" — fast crossing below slow — signals emerging bearish momentum.',
      'The wider the gap after the cross, the stronger the trend confirmation tends to be.',
    ],
    entryRules: [
      'Confirm the cross has actually completed on a closed candle, not mid-formation.',
      'Check that price itself is also trading on the correct side of both averages — a cross with price still tangled between the two lines is a weaker signal.',
      'Favor crosses that occur after a period of consolidation (the averages were flat/close together) over crosses happening in an already-choppy market.',
      'Some traders wait for the gap between the two averages to widen slightly before entering, to filter out crosses that immediately snap back.',
    ],
    exitRules: [
      'A simple exit rule: close the position when the averages cross back the other way.',
      'A tighter approach: set a stop below the most recent swing low (for a bullish cross) or above the most recent swing high (for a bearish cross).',
      'Because MAs lag, exits based purely on the reverse cross will give back some profit before triggering — some traders combine this with a trailing stop for a better balance.',
    ],
    commonMistakes: [
      'Using MA crossovers in a choppy, sideways market, where fast/slow averages whipsaw back and forth generating repeated false signals.',
      'Entering too late after a cross, once most of the move has already happened.',
      'Ignoring that moving averages are a lagging indicator — they confirm a trend already in progress, they don\'t predict one before it starts.',
    ],
    example: 'A crypto asset has been consolidating for weeks with its 9-period and 21-period moving averages tangled together. Price breaks out, and the 9-period MA crosses decisively above the 21-period MA with a widening gap. A trader enters on the confirmed cross, with a stop below the most recent swing low, planning to exit if the MAs cross back the other way.',
    whenToUse: 'Best in trending markets; produces false signals in choppy, sideways conditions.',
    riskNote: 'Moving averages lag price — you will never catch the exact top or bottom with this strategy.',
    popular: true,
  },
  {
    id: 'rsi_reversal',
    name: 'RSI OVERBOUGHT / OVERSOLD',
    icon: '⚡',
    color: '#ff3355',
    difficulty: 'INTERMEDIATE',
    summary: 'Use the Relative Strength Index to spot when a move has stretched too far, too fast.',
    howItWorks: [
      'RSI oscillates between 0 and 100 based on recent gains vs. losses.',
      'A reading above 70 suggests the asset may be overbought and due for a pullback.',
      'A reading below 30 suggests the asset may be oversold and due for a bounce.',
      'The strongest signal comes when RSI crosses back through the 70 or 30 line after being beyond it.',
    ],
    entryRules: [
      'Wait for RSI to cross back through the 70 or 30 threshold rather than entering the instant it first crosses beyond it — this filters out entries too early into a still-strong move.',
      'Look for RSI divergence: price makes a new high/low but RSI does not confirm it with a matching new high/low — a classic warning that momentum is weakening even though price hasn\'t turned yet.',
      'Favor RSI reversal signals in range-bound conditions; in a strong trend, treat overbought/oversold readings as context, not a standalone trigger.',
      'Combine with a price-action confirmation (a reversal candle, a break of a short-term trendline) rather than trading the RSI number in isolation.',
    ],
    exitRules: [
      'A common target for an oversold bounce is the midline (RSI 50) or the next resistance level on price.',
      'Stop-loss goes beyond the recent extreme price low (for a long from oversold) or high (for a short from overbought).',
      'If RSI pushes to a new extreme without the expected reversal, that\'s a sign of trend strength overriding the oversold/overbought signal — exit or avoid rather than fighting it.',
    ],
    commonMistakes: [
      'Shorting purely because RSI says "overbought" during a genuinely strong uptrend — RSI can stay pinned above 70 for a long time in a strong trend.',
      'Ignoring RSI divergence, which is often a higher-quality signal than the raw overbought/oversold reading.',
      'Using RSI as the sole basis for a trade with no price-action or support/resistance confirmation.',
    ],
    example: 'A stock rallies hard and RSI pushes to 78, then starts drifting back down toward 70 while price is still near its high — bearish divergence. RSI then crosses back below 70. A trader shorts on that cross, stops above the recent price high, and targets a pullback to the nearest support zone below.',
    whenToUse: 'Most reliable in range-bound markets; in strong trends, RSI can stay "overbought" or "oversold" for a long time.',
    riskNote: "Don't fight a strong trend just because RSI is extreme — confirm with price action before entering.",
    popular: true,
  },
  {
    id: 'vwap',
    name: 'VWAP BOUNCE / REJECTION',
    icon: '📊',
    color: '#00e0c0',
    difficulty: 'INTERMEDIATE',
    summary: 'Trade around VWAP (Volume-Weighted Average Price) — the price level institutions treat as "fair value" for the session.',
    howItWorks: [
      "VWAP is the average price paid for an asset so far in the session, weighted by how much volume traded at each price — not just a simple average, a volume-honest one.",
      'Big institutional orders are often benchmarked against VWAP — a fund buying "at or better than VWAP" is considered to have gotten a good fill.',
      'Because of that, VWAP tends to act like a magnet and a battleground: price often reverts toward it, and reclaiming or losing it can flip short-term control between buyers and sellers.',
      'A reclaim of VWAP from below (closing back above it) suggests buyers regaining control; losing VWAP from above suggests sellers taking over.',
    ],
    entryRules: [
      'Watch price relative to VWAP, not just its raw value — is price approaching from above or below, and how fast?',
      'For a long: wait for a candle to close back above VWAP after trading below it, ideally with volume picking up on the reclaim.',
      'For a short: wait for a candle to close back below VWAP after trading above it.',
      "Beginners: treat VWAP like a moving support/resistance line on the chart. Experts: watch how price behaves on approach (slowing down vs. slicing through) as a read on order-flow strength, and combine with VWAP standard-deviation bands for statistically stretched entries.",
    ],
    exitRules: [
      'A common stop is the recent swing low/high just before the VWAP reclaim/rejection candle.',
      'A conservative target is a return to the most recent swing high/low; a stretch target is the first VWAP standard-deviation band.',
      'If price chops back and forth across VWAP repeatedly, that is a sign of an indecisive, low-conviction session — many traders reduce size or stand aside.',
    ],
    commonMistakes: [
      'Confusing VWAP with a simple moving average — VWAP resets each session and weights by volume, which is precisely why institutions watch it and a plain MA does not carry the same weight.',
      'Trading VWAP crosses in a straight-line trending market, where price can ride far above/below VWAP all session without ever truly reverting.',
      'Ignoring volume on the reclaim/rejection candle — a low-volume cross back over VWAP is a much weaker signal than one with participation behind it.',
    ],
    example: 'A stock opens and rallies, trading well above its rising VWAP all morning. Around midday it pulls back and closes a candle just below VWAP at $84.20. A trader shorts on that close, stops above the recent high at $85.10, and targets the prior swing low near $82.50 where buyers previously stepped in.',
    whenToUse: 'Most useful intraday, in range-bound or mean-reverting conditions — session-anchored, so it resets and is most meaningful on shorter timeframes.',
    riskNote: 'In a strong one-directional trend day, price can stay far from VWAP for hours — don\'t assume every stretch must snap back immediately.',
    popular: true,
  },
  {
    id: 'bollinger_squeeze',
    name: 'BOLLINGER BAND SQUEEZE',
    icon: '🎈',
    color: '#38bdf8',
    difficulty: 'ADVANCED',
    summary: 'Trade the volatility expansion that follows a period of unusually tight, low-volatility price action.',
    howItWorks: [
      'Bollinger Bands wrap a moving average with an upper and lower band set a couple of standard deviations away — they widen when volatility rises and narrow when it falls.',
      'A "squeeze" is when the bands compress to their tightest range in weeks — the market is coiling, volume and volatility have dried up.',
      'Volatility is cyclical: periods of calm are reliably followed by periods of expansion, even though the direction of that expansion is not predictable in advance.',
      'The breakout direction — the close that finally pushes outside a band after a squeeze — is treated as the signal for which way the expansion is likely to run.',
    ],
    entryRules: [
      'Identify a genuine squeeze first: bandwidth (the % distance between bands) sitting near its lowest levels over the past several weeks, not just "looking a bit tight".',
      'Wait for a confirmed close outside either band after the squeeze — that is the trigger, not the squeeze itself (you cannot know the direction in advance).',
      'Confirm with volume expanding on the breakout candle — a squeeze breakout on dead volume is a much weaker signal.',
      'Advanced/expert refinement: watch for a false breakout in one direction that quickly reverses back inside the bands — this "fakeout, then real move the other way" is a well-documented squeeze failure pattern worth recognizing rather than trading blindly.',
    ],
    exitRules: [
      'Initial stop back on the other side of the band range (the opposite band level) — if price re-enters the squeeze zone, the expansion has likely failed.',
      'A common target uses the width of the squeeze itself, projected from the breakout point (a measured move, same logic as a breakout trade).',
      'Because the move after a genuine squeeze can run hard and fast, many traders trail their stop aggressively once the move is confirmed rather than using a single fixed target.',
    ],
    commonMistakes: [
      'Guessing the breakout direction before it happens and entering inside the squeeze — the entire point of this strategy is that direction is unknowable until price actually breaks a band.',
      'Confusing a normal narrow range with a true statistical squeeze — compare current bandwidth against its own recent history, not against a fixed number.',
      'Ignoring the failed-breakout pattern — an early band-poke that snaps back is a classic trap for traders entering on the very first close outside the band.',
    ],
    example: 'A crypto pair chops in an extremely tight range for two weeks, its Bollinger Bandwidth sitting at its lowest reading in three months. Price then closes decisively above the upper band on a volume spike. A trader enters on that close, with a stop back at the lower band and a target equal to the width of the squeeze range projected upward from the breakout.',
    whenToUse: 'Works on any timeframe wherever a market has visibly gone quiet after a period of normal activity — the tighter and longer the squeeze, the more significant the eventual expansion tends to be.',
    riskNote: 'The bands tell you volatility is coming, never which direction — always wait for the actual breakout close before committing.',
  },
  {
    id: 'macd',
    name: 'MACD CROSSOVER',
    icon: '📉',
    color: '#c084fc',
    difficulty: 'EXPERT',
    summary: 'Use the MACD (Moving Average Convergence Divergence) indicator to catch momentum shifts earlier than a simple price-based moving average cross.',
    howItWorks: [
      'MACD is built from two moving averages of price (typically 12-period and 26-period EMAs) — the "MACD line" is the difference between them.',
      'A "signal line" (a 9-period EMA of the MACD line itself) is plotted alongside it — when the MACD line crosses the signal line, that is the trade trigger.',
      'The MACD line crossing above zero means the fast EMA has moved above the slow EMA (bullish momentum regime); crossing below zero is the reverse.',
      "Because MACD is built from moving averages of moving averages, it reacts to changing momentum with less lag than watching a single MA cross on price alone, though it is still fundamentally a lagging, trend-following tool.",
    ],
    entryRules: [
      'Confirm the MACD line has closed above (bullish) or below (bearish) the signal line on a completed bar.',
      'Check whether the cross happens above or below the zero line: a bullish cross below zero is an earlier, higher-risk "momentum turning up from a downtrend" signal, while a bullish cross above zero confirms an already-established uptrend — treat them differently.',
      "Expert-level refinement: watch for MACD divergence — price making a new high/low that the MACD histogram does NOT confirm with a matching new extreme. This is one of the more reliable early-warning signs of a weakening trend, well before the cross itself fires.",
      'Combine with the histogram (the gap between the MACD and signal lines): a shrinking histogram ahead of the cross shows momentum already fading, giving more confidence in the signal once it prints.',
    ],
    exitRules: [
      'A straightforward exit is the opposite MACD/signal cross — but because MACD lags, this gives back some profit versus the ideal exit point.',
      'Many traders instead exit on histogram deceleration (the gap between MACD and signal starting to shrink) rather than waiting for the full reverse cross.',
      'Stop-loss placement should still come from price structure (recent swing high/low), since MACD itself has no fixed price level to anchor a stop to.',
    ],
    commonMistakes: [
      'Treating every MACD cross as equally strong — a cross far above/below the zero line, after an already-extended move, is a much weaker signal than one near the zero line at the start of a new trend.',
      'Ignoring divergence, which is often the highest-quality information MACD provides and is missed by traders who only watch for the cross.',
      'Using MACD alone with no price-action or support/resistance context — like any lagging indicator, it confirms what has already started rather than predicting what is about to happen.',
    ],
    example: 'A stock has been declining for weeks. Price prints a lower low, but the MACD histogram prints a HIGHER low than its prior swing — bearish momentum is fading even as price ekes out a new low (bullish divergence). Days later, the MACD line crosses above its signal line, both still below zero. A trader treats this as an early trend-reversal signal, enters on the cross, and stops below the recent low.',
    whenToUse: 'Most informative on higher timeframes and trending markets; the divergence signal in particular is a favorite among more experienced traders for catching reversals early.',
    riskNote: 'MACD is a lagging indicator built on lagging indicators — it will never call an exact top or bottom, and works best combined with other confirmation rather than traded in isolation.',
  },
  {
    id: 'turtle_breakout',
    name: 'TURTLE TRADING (DONCHIAN BREAKOUT)',
    icon: '🐢',
    color: '#22d3ee',
    difficulty: 'EXPERT',
    summary: 'The exact system that turned a group of trainees with no trading experience into some of the most successful trend-followers in history.',
    howItWorks: [
      'In 1983, legendary trader Richard Dennis trained a group of ordinary people ("the Turtles") in a rules-based trend-following system to settle a bet about whether trading skill could be taught.',
      'The core entry rule: buy when price closes above its highest high of the last 20 periods (the "Donchian Channel"); sell short when it closes below the lowest low of the last 20 periods.',
      'The Turtles went on to generate hundreds of millions of dollars in real, audited trading profits over the following years — one of the most rigorously documented proofs that a simple, mechanical breakout system can have a genuine, durable edge.',
      'The system has no opinion about WHY price is breaking out — it simply follows the breakout wherever it goes, exiting only when the trend genuinely reverses.',
    ],
    entryRules: [
      'Track the rolling 20-period high and low (the Donchian Channel) on your instrument and timeframe of choice.',
      'Enter long the moment price closes above the 20-period high; enter short the moment it closes below the 20-period low.',
      'The original system used a SECOND, shorter breakout (a 10-period channel) as a faster "system 1" alongside the slower 20-period "system 2" — many modern adaptations stick to just the slower one to reduce false signals.',
      'Position size was originally based on volatility (the "N" / average true range) so that a single unit risks a consistent amount regardless of how volatile the instrument is — a core piece of why the system survived so many different market regimes.',
    ],
    exitRules: [
      'The classic exit is the OPPOSITE, shorter channel: exit a long when price closes below the 10-period low (not the 20-period low used for entry).',
      'This asymmetry — slow channel to get in, fast channel to get out — lets winning trends run much further than the initial entry signal alone would suggest.',
      'Because this is a trend-following system, most individual trades lose money — the entire edge comes from a smaller number of large winners running far longer than the losers cost, so cutting losers fast on the exit channel is essential, not optional.',
    ],
    commonMistakes: [
      'Abandoning the system after a string of losses — trend-following systems are designed to have a lower win rate than they "feel" like they should, and second-guessing the mechanical rules is exactly how traders give up the edge right before a big trend arrives.',
      "Ignoring position sizing/volatility — the original system's survival depended as much on disciplined, volatility-adjusted sizing as on the entry rule itself.",
      'Applying it to a choppy, range-bound market with no real trends — pure breakout systems are structurally suited to trending conditions and will bleed small losses in a sideways market.',
    ],
    example: 'A commodity has been range-bound for months. Price finally closes above its 20-period high at $52.40. A trader enters long there. The trend runs for weeks; when price eventually closes below the 10-period low at $58.10, the trader exits — a textbook Turtle-style trade capturing the bulk of a sustained move.',
    whenToUse: 'Works across virtually any liquid, trending market and timeframe — historically applied to commodities, futures, currencies, and stock indices alike.',
    riskNote: 'Expect a win rate well under 50% — the edge comes entirely from letting winners run far longer than losers cost, which requires real discipline to sit through.',
    provenProfitable: true,
  },
  {
    id: 'momentum',
    name: 'MOMENTUM / RELATIVE STRENGTH',
    icon: '🚄',
    color: '#f97316',
    difficulty: 'ADVANCED',
    summary: 'Buy what has already been going up, sell what has already been going down — one of the most replicated findings in all of academic finance.',
    howItWorks: [
      'Momentum investing rests on a simple, uncomfortable-sounding premise: assets that have outperformed over the recent past (commonly 3-12 months) tend to keep outperforming over the following months, and vice versa for laggards.',
      'This was formally documented by Jegadeesh & Titman in a landmark 1993 study, and has since been replicated across nearly every major asset class and market in the world — one of the most robust, repeatedly-confirmed anomalies in finance research.',
      'The mechanism isn\'t fully agreed on, but leading explanations include investor underreaction to new information and slow-moving capital chasing recent winners — both of which take time to fully play out, which is exactly the window momentum strategies exploit.',
      'Unlike most technical setups which look for a specific chart pattern, momentum is a relative-strength ranking exercise: measure the rate of change over your lookback window and rank/trade in the direction of the strongest movers.',
    ],
    entryRules: [
      'Measure the percentage rate of change over a lookback window (commonly 20-250 periods depending on timeframe) rather than eyeballing "it looks strong."',
      'Enter in the direction of unusually strong recent performance — a large positive rate of change for a long, a large negative one for a short.',
      'Momentum works best evaluated RELATIVE to a peer group or benchmark (is this outperforming similar assets, not just moving in absolute terms) — the single-asset version used here is a simplified read of the same underlying idea.',
      'Combine with a trend or volume filter to avoid entering right as an extended move exhausts itself — pure momentum entries can chase a move that is about to stall.',
    ],
    exitRules: [
      'Academic momentum studies typically hold for a fixed period (e.g. 3-12 months) and simply re-rank — a much longer holding horizon than most technical setups on this list.',
      'A practical stop is a violation of the trend that generated the signal (e.g. price closing back below the level it broke out from).',
      'Momentum is well documented to occasionally suffer sharp, fast reversals ("momentum crashes") — using a real stop-loss, not just letting a momentum trade run indefinitely, is important precisely because the historical outperformance comes with real tail risk.',
    ],
    commonMistakes: [
      'Confusing momentum with simply "buying something that went up a little" — the documented edge is about relative strength over a meaningful lookback window, not a single green candle.',
      'Ignoring the well-known "momentum crash" risk — sharp reversals after extended runs are a real, documented feature of this strategy, not a bug.',
      'Chasing momentum without any risk control, on the assumption that "it\'s proven to work" — the academic edge is a statistical tendency across many trades and long periods, not a guarantee on any single one.',
    ],
    example: 'Over the past 6 months, an asset has outperformed its peers by a wide margin — up 45% versus a 12% average for similar assets. A momentum trader takes a position expecting the outperformance to persist over the following months, with a stop below the recent trend structure in case the move stalls.',
    whenToUse: 'Historically documented across stocks, commodities, currencies, and international markets, on multi-week to multi-month holding horizons — not a fast intraday setup.',
    riskNote: '"Momentum crashes" — sharp, fast reversals after extended winning streaks — are a well-documented risk of this exact strategy. Always trade it with a real stop.',
    provenProfitable: true,
  },
  {
    id: 'ichimoku',
    name: 'ICHIMOKU CLOUD (TK CROSS)',
    icon: '☁️',
    color: '#a78bfa',
    difficulty: 'ADVANCED',
    summary: 'One of the most widely used systems among retail forex and crypto traders worldwide — a full trend/momentum/support-resistance system built from Japanese candlestick-era analysis.',
    howItWorks: [
      'Ichimoku ("one glance") combines five lines from simple period-based high/low midpoints into a single system meant to show trend direction, momentum, and support/resistance all at once.',
      'The Tenkan-sen ("conversion line", 9-period) and Kijun-sen ("base line", 26-period) are the two most-watched — when the faster Tenkan-sen crosses above the slower Kijun-sen, it\'s read as a bullish signal (and the reverse for bearish), similar in spirit to a moving average cross but built from high/low midpoints instead of closes.',
      'The full system also plots a shaded "cloud" (Kumo) projected forward in time, used as a dynamic support/resistance zone — this simplified version focuses on the TK cross, the single most commonly traded Ichimoku signal.',
      'Ichimoku is especially popular in forex and crypto communities specifically because it packages trend + momentum + key levels into one glance, which is where its name comes from.',
    ],
    entryRules: [
      'Wait for a confirmed Tenkan-sen/Kijun-sen cross on a closed candle, not mid-formation.',
      'Many Ichimoku traders only take TK crosses that align with the direction of the broader cloud (price above the cloud favors longs, below favors shorts) — this simplified version doesn\'t check cloud position, so treat a cross against the higher-timeframe trend with extra caution.',
      'A cross happening further from the current cloud (a bigger gap between the two lines resolving) is generally read as a stronger signal than a cross with the lines barely separating.',
      'Because Ichimoku packages several concepts at once, many traders treat it as a full system rather than picking just one signal — the TK cross alone is a simplification of the complete method.',
    ],
    exitRules: [
      'A straightforward exit is the reverse TK cross.',
      'Some traders instead use the Kijun-sen line itself as a trailing stop reference once in profit.',
      'As with any moving-average-style cross, exits based purely on the reverse signal will give back some profit versus the ideal exit point — a real stop-loss based on price structure is still worth using alongside it.',
    ],
    commonMistakes: [
      'Trading the TK cross in isolation without any awareness of the broader cloud/trend context, which the full system was actually designed around.',
      'Treating Ichimoku as a magic all-in-one system rather than one more trend/momentum tool that still needs risk management like any other.',
      'Using it on very short timeframes where the 9/26-period lines produce a lot of noisy whipsaws — Ichimoku is traditionally applied on daily charts, though it\'s widely adapted to shorter ones too.',
    ],
    example: 'A crypto asset has been consolidating. The 9-period Tenkan-sen crosses above the 26-period Kijun-sen, with price also trading above the cloud. A trader treats this as confirmation of a bullish TK cross and enters long, using the Kijun-sen line as a trailing reference for managing the position.',
    whenToUse: 'Extremely popular in forex and crypto, most traditionally on daily charts, though widely adapted across timeframes.',
    riskNote: 'The TK cross alone is a simplification — the full Ichimoku system uses the cloud for context, and trading the cross in isolation loses some of that filtering.',
    popular: true,
  },
  {
    id: 'parabolic_sar',
    name: 'PARABOLIC SAR',
    icon: '🎯',
    color: '#facc15',
    difficulty: 'INTERMEDIATE',
    summary: 'A dot-based trend and trailing-stop system from the same creator as RSI, still in everyday use decades after its introduction.',
    howItWorks: [
      'Parabolic SAR ("Stop And Reverse") was developed by J. Welles Wilder — the same technical analyst who created RSI and the ATR indicator — and plots a series of dots above or below price that flip sides when the trend reverses.',
      'While price is trending up, the dots sit below price and creep upward, accelerating as the trend continues — designed to function as a trailing stop that tightens the longer a trend runs.',
      'When price crosses through the dots, SAR "flips" to the other side — this flip is the entry/exit signal: dots moving from above to below price is bullish, the reverse is bearish.',
      'The "parabolic" name comes from the accelerating curve the dots trace as a trend extends, which is also why the indicator performs poorly in sideways, non-trending markets — it keeps flipping back and forth.',
    ],
    entryRules: [
      'Wait for a confirmed SAR flip — dots switching from above price to below (bullish) or below to above (bearish).',
      'SAR works best used as a trend-following filter alongside another indicator, rather than as a standalone entry trigger — it was designed primarily as a trailing-stop mechanism, not a standalone entry system.',
      'A flip that happens after a long, clean trending run is generally more meaningful than one in a choppy, directionless market where SAR whipsaws constantly.',
      'Some traders wait for price to close beyond the new SAR level (not just touch it) before treating the flip as confirmed.',
    ],
    exitRules: [
      'This is the indicator\'s original purpose: use the current SAR dot itself as a continuously-trailing stop-loss level, exiting (or reversing) whenever price crosses it.',
      'Because the dots accelerate the longer a trend runs, SAR naturally tightens your stop as a winning trade matures — locking in more of the move automatically.',
      'In a strong trend, SAR can trail quite far behind price early on — some traders use a fixed initial stop until the trend is established, switching to SAR once it "catches up".',
    ],
    commonMistakes: [
      'Using Parabolic SAR in a sideways, range-bound market, where the constant flipping generates a stream of false signals — this is by far its most common misuse.',
      'Treating every flip as a fresh, high-conviction entry signal rather than what it was actually designed for: a trailing stop and rough trend-direction filter.',
      'Ignoring that SAR is a lagging indicator like any moving-average-based tool — it confirms a reversal after it has already begun, not before.',
    ],
    example: 'A stock is in a clean uptrend, its SAR dots trailing below price and rising each period. Price finally dips through the SAR level, flipping the dots above price. A trader treats this flip as their trailing stop being hit, exiting the long position with much of the trend\'s gains already locked in.',
    whenToUse: 'Best in trending markets, and specifically well-suited as a trailing-stop mechanism for a position entered via another strategy.',
    riskNote: 'Performs poorly and generates frequent false flips in sideways, range-bound conditions — confirm there is an actual trend before relying on it.',
    popular: true,
  },
];

export function getStrategy(id: string) {
  return STRATEGIES.find(s => s.id === id);
}
