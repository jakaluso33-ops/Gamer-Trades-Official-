import { supabase } from './supabase';
import { logEvent } from './activity';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
};

export const SKILL_LEVEL_ICON: Record<SkillLevel, string> = {
  beginner: '🌱',
  intermediate: '📈',
  advanced: '🎯',
  expert: '🏆',
};

export const SKILL_LEVEL_COLOR: Record<SkillLevel, string> = {
  beginner: '#00ff88',
  intermediate: '#00aaff',
  advanced: '#ffd700',
  expert: '#ff3355',
};

export const SKILL_LEVEL_BLURB: Record<SkillLevel, string> = {
  beginner: 'Never traded before. Learn what a candlestick actually is.',
  intermediate: 'Know the basics. Ready for support/resistance, trends, and risk.',
  advanced: 'Comfortable trading. Time for chart patterns and indicators.',
  expert: 'Sharpen the edge: risk math, psychology, and portfolio discipline.',
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export type DetectorId = 'breakout' | 'orb' | 'fibonacci' | 'support_resistance' | 'ma_crossover' | 'rsi_reversal';

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  body: string[];
  quiz: QuizQuestion;
  /** If set, this lesson's pattern can be spotted live — lesson gets a "VIEW LIVE ON CHART" button. */
  chartConcept?: DetectorId;
}

export const CURRICULUM: Record<SkillLevel, Lesson[]> = {
  beginner: [
    {
      id: 'b_candlesticks',
      title: 'What Is a Candlestick?',
      icon: '🕯️',
      body: [
        'Every candle on a chart represents price movement over a fixed period of time — a minute, an hour, a day, whatever timeframe you\'ve selected.',
        'Each candle has a "body" (the thick rectangle) showing the open and close price, and "wicks" (the thin lines above/below) showing the highest and lowest price reached during that period.',
        'A GREEN candle means the price closed HIGHER than it opened (bullish). A RED candle means it closed LOWER than it opened (bearish).',
      ],
      quiz: {
        question: 'A green candle means the price...',
        options: ['Closed higher than it opened', 'Closed lower than it opened', 'Didn\'t move at all', 'Hit an all-time high'],
        correctIndex: 0,
      },
    },
    {
      id: 'b_wicks',
      title: 'Reading Wicks',
      icon: '📍',
      body: [
        'The wick (or "shadow") above a candle body shows the HIGHEST price traded during that period, even if the price didn\'t close there.',
        'The wick below shows the LOWEST price traded.',
        'Long wicks tell a story — a long upper wick means buyers pushed price up but sellers pushed it back down before the candle closed. That\'s often a sign of rejection at that price level.',
      ],
      quiz: {
        question: 'A long wick above a candle body usually shows...',
        options: ['The lowest price of the day', 'Price was pushed up then rejected back down', 'The candle is bullish', 'Nothing meaningful'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_buy_sell',
      title: 'Buy vs. Sell (Long vs. Short)',
      icon: '⚖️',
      body: [
        'BUYING (going "long") means you profit if the price goes UP. You buy low, hope to sell higher.',
        'SELLING (going "short") means you profit if the price goes DOWN. You\'re betting against the asset.',
        'In GamerTrades, when you tap SELL without already owning the asset, you open a short position — you\'re borrowing and selling now, planning to buy back later at a lower price.',
      ],
      quiz: {
        question: 'If you go SHORT on BTC/USD, you profit when the price...',
        options: ['Goes up', 'Goes down', 'Stays exactly the same', 'Only during market close'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_markets',
      title: 'The Different Markets',
      icon: '🌐',
      body: [
        'STOCKS: ownership shares in a company (e.g. Apple, Tesla). Trade during exchange hours on weekdays.',
        'CRYPTO: digital currencies like Bitcoin and Ethereum. Trades 24/7, including weekends — no closing bell.',
        'FOREX: currency pairs (e.g. EUR/USD) — betting on one currency\'s strength against another. Runs nearly around the clock on weekdays.',
        'FUTURES: contracts to buy/sell a commodity or index at a set price later — used for everything from oil to gold to stock indices.',
        'OPTIONS: contracts giving the right (not obligation) to buy/sell at a set price — more advanced, higher risk/reward.',
        'INDICES: a basket of stocks tracked together (e.g. S&P 500) — a snapshot of a whole market\'s health.',
      ],
      quiz: {
        question: 'Which market trades 24/7, including weekends?',
        options: ['Stocks', 'Crypto', 'Options', 'Futures'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_market_size',
      title: 'How Much Money Moves in Each Market',
      icon: '💵',
      body: [
        'FOREX is the biggest market on Earth — roughly $7+ TRILLION changes hands every single day.',
        'The global STOCK market trades around $200-500 BILLION per day across major exchanges like the NYSE and Nasdaq.',
        'CRYPTO trades roughly $50-100 BILLION per day across all coins combined — smaller than stocks or forex, but it never sleeps.',
        'FUTURES markets (oil, gold, index futures) move hundreds of billions per day, concentrated around key economic data and session opens.',
        'These are rough, constantly-shifting estimates — the point is to understand relative scale: forex >> stocks > futures > crypto, in terms of daily dollar volume.',
      ],
      quiz: {
        question: 'Which market has the largest daily trading volume?',
        options: ['Crypto', 'Stocks', 'Forex', 'Options'],
        correctIndex: 2,
      },
    },
  ],
  intermediate: [
    {
      id: 'i_support_resistance',
      title: 'Support & Resistance',
      icon: '📏',
      body: [
        'SUPPORT is a price level where buying pressure has historically stepped in, stopping a price decline — think of it as a floor.',
        'RESISTANCE is a price level where selling pressure has historically capped a price rise — a ceiling.',
        'These levels aren\'t exact lines — think of them as zones. The more times a level holds, the more traders watch it, which can make it a self-fulfilling prophecy.',
      ],
      quiz: {
        question: 'Resistance acts like a...',
        options: ['Floor that stops price from falling', 'Ceiling that stops price from rising', 'Random price with no meaning', 'Guaranteed reversal signal'],
        correctIndex: 1,
      },
      chartConcept: 'support_resistance',
    },
    {
      id: 'i_trends',
      title: 'Trends & Trendlines',
      icon: '📈',
      body: [
        'An UPTREND is a series of higher highs and higher lows. A DOWNTREND is lower highs and lower lows.',
        'A trendline connects swing highs (downtrend) or swing lows (uptrend) to visualize the trend\'s direction and slope.',
        '"The trend is your friend" — trading in the direction of the dominant trend generally has better odds than fighting it.',
      ],
      quiz: {
        question: 'An uptrend is defined by...',
        options: ['Lower highs and lower lows', 'Higher highs and higher lows', 'Sideways price action', 'Only green candles'],
        correctIndex: 1,
      },
    },
    {
      id: 'i_volume',
      title: 'Volume Basics',
      icon: '📊',
      body: [
        'Volume measures how many units (shares, contracts, coins) traded during a period — shown as bars beneath the chart.',
        'High volume on a move adds conviction — a breakout on heavy volume is more trustworthy than one on light volume.',
        'Volume often spikes at the open, at major news, and around key support/resistance tests.',
      ],
      quiz: {
        question: 'A breakout on high volume is generally...',
        options: ['Less reliable', 'More reliable', 'Impossible to interpret', 'Always a fakeout'],
        correctIndex: 1,
      },
    },
    {
      id: 'i_risk_basics',
      title: 'Risk Management Basics',
      icon: '🛡️',
      body: [
        'Position sizing — how much you put into a single trade — matters more than most beginners realize. Risking a small, consistent % of your account per trade keeps one bad trade from wiping you out.',
        'A stop-loss is a predetermined exit price if the trade moves against you, protecting your downside before emotions take over.',
        'A common guideline (not a rule): risk no more than 1-2% of your account on any single trade.',
      ],
      quiz: {
        question: 'A stop-loss is used to...',
        options: ['Guarantee a profit', 'Limit your downside on a losing trade', 'Increase your position size', 'Avoid paying fees'],
        correctIndex: 1,
      },
    },
    {
      id: 'i_orders',
      title: 'Order Types',
      icon: '📝',
      body: [
        'A MARKET order executes immediately at the current price — fast, but you don\'t control the exact fill price.',
        'A LIMIT order only fills at your chosen price or better — you control price, but it might not fill at all.',
        'A STOP order triggers a market order once price hits a certain level — often used to enter breakouts or cut losses.',
      ],
      quiz: {
        question: 'Which order type guarantees immediate execution but not the exact price?',
        options: ['Limit order', 'Stop order', 'Market order', 'None of them'],
        correctIndex: 2,
      },
    },
  ],
  advanced: [
    {
      id: 'a_breakout',
      title: 'Breakout Trading',
      icon: '🚀',
      body: [
        'A breakout happens when price pushes decisively through a well-established support or resistance level, often signaling the start of a new move.',
        'Confirm with volume — a breakout on low volume is more likely to fail ("fakeout").',
        'Check the LIVE SIGNALS panel on the Trade Desk and the full Academy strategy guide for the exact detection logic used in this app.',
      ],
      quiz: {
        question: 'A breakout on low volume is...',
        options: ['Always reliable', 'More likely to fail', 'Guaranteed profit', 'Irrelevant to volume'],
        correctIndex: 1,
      },
      chartConcept: 'breakout',
    },
    {
      id: 'a_orb',
      title: 'Opening Range Breakout',
      icon: '🔔',
      body: [
        'The opening range is the high/low set in the first few minutes after a market opens.',
        'A break above that range signals bullish momentum; a break below signals bearish momentum.',
        'See the full ORB strategy guide in the Academy tab for entry rules and risk notes.',
      ],
      quiz: {
        question: 'The "opening range" refers to...',
        options: ['The whole trading day\'s range', 'The high/low in the first few minutes after open', 'Yesterday\'s closing range', 'A random price window'],
        correctIndex: 1,
      },
      chartConcept: 'orb',
    },
    {
      id: 'a_fibonacci',
      title: 'Fibonacci Retracement',
      icon: '🌀',
      body: [
        'Fibonacci levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) mark likely pullback zones within a trend.',
        'Traders watch for a bounce at one of these levels, especially 38.2%, 50%, or 61.8%, as a possible continuation point.',
        'See the full Fibonacci guide in the Academy tab.',
      ],
      quiz: {
        question: 'Fibonacci retracement levels are used to identify...',
        options: ['Random price targets', 'Likely pullback zones within a trend', 'Guaranteed reversal points', 'Trading fees'],
        correctIndex: 1,
      },
      chartConcept: 'fibonacci',
    },
    {
      id: 'a_ma_crossover',
      title: 'Moving Average Crossover',
      icon: '✂️',
      body: [
        'A moving average smooths price into a single trend-following line over a chosen period.',
        'When a faster (shorter-period) MA crosses above a slower (longer-period) MA, that\'s often read as bullish momentum — and the reverse for bearish.',
        'See the full MA Crossover guide in the Academy tab.',
      ],
      quiz: {
        question: 'A fast MA crossing above a slow MA is typically read as...',
        options: ['Bearish', 'Bullish', 'Meaningless', 'A sell signal only'],
        correctIndex: 1,
      },
      chartConcept: 'ma_crossover',
    },
    {
      id: 'a_rsi_reversal',
      title: 'RSI Overbought / Oversold',
      icon: '⚡',
      body: [
        'RSI (Relative Strength Index) measures how fast and how far price has moved recently, on a scale of 0-100.',
        'RSI above 70 is generally considered "overbought" — the move may be stretched and due for a pullback. Below 30 is "oversold" — potentially due for a bounce.',
        'RSI extremes are a caution flag, not an automatic reversal signal — a strong trend can stay "overbought" for a long time.',
      ],
      quiz: {
        question: 'RSI above 70 generally signals...',
        options: ['Oversold conditions', 'Overbought conditions', 'A guaranteed crash', 'Nothing meaningful'],
        correctIndex: 1,
      },
      chartConcept: 'rsi_reversal',
    },
  ],
  expert: [
    {
      id: 'e_position_sizing',
      title: 'Risk/Reward Math',
      icon: '🧮',
      body: [
        'Risk/reward ratio compares how much you stand to lose vs. gain on a trade. A 1:3 ratio means risking $1 to potentially make $3.',
        'Even a strategy that wins less than half the time can be profitable long-term if the average winner is bigger than the average loser.',
        'Expected value = (win rate × avg win) − (loss rate × avg loss). Think in terms of expected value, not any single trade\'s outcome.',
      ],
      quiz: {
        question: 'A profitable strategy always needs a win rate above 50%.',
        options: ['True', 'False — a good risk/reward ratio can offset a lower win rate'],
        correctIndex: 1,
      },
    },
    {
      id: 'e_diversification',
      title: 'Portfolio Diversification',
      icon: '🗂️',
      body: [
        'Spreading capital across uncorrelated assets (e.g. stocks + crypto + forex) reduces the impact of any single market\'s bad day.',
        'Diversification doesn\'t eliminate risk — it manages it. Concentrated bets can outperform, but they carry more variance.',
        'GamerTrades lets you practice across 6 asset classes for exactly this reason — use the Trading Arena to build reps in more than one market.',
      ],
      quiz: {
        question: 'Diversification primarily helps by...',
        options: ['Guaranteeing profit', 'Reducing the impact of any single market\'s move', 'Eliminating all risk', 'Increasing leverage'],
        correctIndex: 1,
      },
    },
    {
      id: 'e_psychology',
      title: 'Trading Psychology',
      icon: '🧠',
      body: [
        'Revenge trading — increasing size or frequency right after a loss to "win it back" — is one of the fastest ways to blow up an account.',
        'FOMO (fear of missing out) entries, chasing a move that\'s already extended, tend to have the worst risk/reward of any entry type.',
        'A trading journal — logging why you entered, not just the outcome — is one of the highest-leverage habits for long-term improvement. Your Trade History screen is a start.',
      ],
      quiz: {
        question: 'Revenge trading means...',
        options: ['Trading with a plan', 'Increasing risk right after a loss to "win it back"', 'Diversifying across markets', 'Using a stop-loss'],
        correctIndex: 1,
      },
    },
    {
      id: 'e_backtesting',
      title: 'The Backtesting Mindset',
      icon: '🔬',
      body: [
        'Before trusting a strategy with real conviction, test it against historical data to see how it would have performed across many market conditions.',
        'A strategy that only works in one specific market regime (e.g. a strong uptrend) isn\'t robust — look for consistency across different conditions.',
        'Journal every trade\'s setup and outcome. Patterns in your own results are often more valuable than any single indicator.',
      ],
      quiz: {
        question: 'A "robust" strategy is one that...',
        options: ['Only works in one market condition', 'Performs consistently across different market conditions', 'Wins 100% of the time', 'Requires no testing'],
        correctIndex: 1,
      },
    },
  ],
};

export function lessonsForLevel(level: SkillLevel): Lesson[] {
  return CURRICULUM[level];
}

const LESSON_XP = 25;

export async function setSkillLevel(userId: string, level: SkillLevel): Promise<void> {
  const { error } = await supabase.from('profiles').update({ skill_level: level }).eq('id', userId);
  if (error) throw error;
}

/** Marks a lesson complete and awards XP once, the first time it's completed. */
export async function completeLesson(userId: string, lessonId: string, completedLessons: string[]): Promise<string[]> {
  if (completedLessons.includes(lessonId)) return completedLessons;

  const next = [...completedLessons, lessonId];
  const { error } = await supabase.from('profiles').update({ completed_lessons: next }).eq('id', userId);
  if (error) throw error;

  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  if (profile) {
    await supabase.from('profiles').update({ xp: (profile as { xp: number }).xp + LESSON_XP }).eq('id', userId);
  }

  await logEvent(userId, 'lesson_completed', { lessonId });
  return next;
}
