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
    {
      id: 'b_chart_types',
      title: 'Chart Types: Line vs. Bar vs. Candlestick',
      icon: '📉',
      body: [
        'A LINE CHART connects closing prices with a single line. It\'s the simplest view — great for seeing the big-picture trend, but it hides everything that happened within each period.',
        'A BAR CHART (OHLC bar) shows open, high, low, and close as tick marks on a vertical line — a small left tick for open, a small right tick for close. It carries the same information as a candlestick but is harder to read at a glance.',
        'A CANDLESTICK CHART is the industry standard for a reason: the colored body makes it instantly obvious whether a period was bullish or bearish, and the wicks show the extremes, all in one glance.',
        'GamerTrades charts default to candlesticks because they pack the most information into the least amount of visual effort — which matters when you\'re scanning many symbols quickly, like on the Master Trader Scanner.',
        'Some traders also use HEIKIN-ASHI charts, a smoothed variant of candlesticks that averages price over time to make trends easier to see — useful for filtering out noise, at the cost of showing the true open/close of any single period.',
      ],
      quiz: {
        question: 'Why do most traders prefer candlestick charts over line charts?',
        options: [
          'Candlesticks are required by law on regulated exchanges',
          'Candlesticks show open, high, low, and close at a glance, not just the closing price',
          'Line charts cannot show more than one day of data',
          'Candlesticks are only available on crypto platforms',
        ],
        correctIndex: 1,
      },
    },
    {
      id: 'b_timeframes',
      title: 'Timeframes: Choosing Your Zoom Level',
      icon: '⏱️',
      body: [
        'A "timeframe" is how much real time each candle on the chart represents — 1 minute, 5 minutes, 1 hour, 1 day, and so on. Switching timeframes is like zooming a camera in or out on the exact same price history.',
        'LOWER timeframes (1m, 5m) show more detail and more noise — every small wiggle becomes visible, which can make you feel like something meaningful is happening when it\'s often just randomness.',
        'HIGHER timeframes (1H, 4H, 1D) smooth that noise out and reveal the more durable trend — but you react to information later, since each candle takes longer to close.',
        'A common beginner mistake is only looking at one timeframe. Checking a higher timeframe for the overall trend, then a lower one for a precise entry, is called "multiple timeframe analysis" and is one of the most reliable habit upgrades a new trader can make.',
        'There\'s no single "correct" timeframe — it depends on how long you intend to hold a position. A day trader closing everything before the close might live on the 1m-15m charts; a swing trader holding for days or weeks lives on the 1H-1D charts.',
      ],
      quiz: {
        question: 'Trading only on very low timeframes (like 1-minute charts) tends to expose you to more...',
        options: ['Long-term trend clarity', 'Noise and false signals', 'Guaranteed profits', 'Lower volatility'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_bid_ask',
      title: 'The Bid-Ask Spread',
      icon: '↔️',
      body: [
        'Every tradeable asset has two prices at any instant: the BID (the highest price a buyer is currently willing to pay) and the ASK/OFFER (the lowest price a seller is currently willing to accept).',
        'The gap between them is the SPREAD. If BTC/USD shows a bid of $64,998 and an ask of $65,002, the spread is $4 — that\'s the built-in cost of getting in and out of a trade immediately.',
        'A TIGHT (small) spread usually means a liquid, heavily-traded asset — lots of buyers and sellers close together in price. A WIDE spread usually means thinner trading — fewer participants, so buyers and sellers are further apart.',
        'When you place a market BUY order, you pay the ask. When you place a market SELL order, you receive the bid. That\'s why a round-trip trade (buy then immediately sell) at the exact same market price still loses a tiny bit of money — you crossed the spread twice.',
        'Wide spreads matter most for short-term, high-frequency trading, where the spread can eat a meaningful chunk of a small expected profit. For longer swing trades, the spread is usually a rounding error compared to the size of the expected move.',
      ],
      quiz: {
        question: 'If BTC/USD has a bid of $64,998 and an ask of $65,002, what is the spread?',
        options: ['$65,000', '$2', '$4', '$64,998'],
        correctIndex: 2,
      },
    },
    {
      id: 'b_liquidity_market_cap',
      title: 'Liquidity & Market Cap',
      icon: '🌊',
      body: [
        'LIQUIDITY describes how easily an asset can be bought or sold without moving its price much. A highly liquid asset (like BTC or a large-cap stock) can absorb a big order with barely a ripple. An illiquid asset can spike or crash on a relatively small order.',
        'MARKET CAP (market capitalization) for a stock is share price × total shares outstanding — it\'s a rough measure of a company\'s total value as priced by the market. For crypto, it\'s coin price × circulating supply.',
        'Large-cap assets (big, well-known companies or top cryptocurrencies) tend to be more liquid and less volatile day-to-day. Small/micro-cap assets can move dramatically on relatively little news or volume — higher potential reward, but sharply higher risk.',
        'Low liquidity is dangerous for a specific reason: SLIPPAGE. If you try to sell a large position in a thin market, your own order can push the price down as it fills, so your average exit price ends up worse than the price you saw when you clicked "sell."',
        'Before trading an unfamiliar symbol, it\'s worth asking: how much volume does this actually trade? A chart can look identical for a mega-cap stock and a thinly-traded penny stock — but the real-world experience of entering and exiting a position in each is completely different.',
      ],
      quiz: {
        question: 'Low liquidity in a market mainly increases the risk of...',
        options: ['Guaranteed profit', 'Slippage — your order moving the price against you as it fills', 'Lower spreads', 'Zero volatility'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_leverage_margin',
      title: 'Leverage & Margin — A Careful Introduction',
      icon: '⚠️',
      body: [
        'LEVERAGE lets you control a larger position than your account balance alone would allow, by borrowing the difference. 10x leverage means a $100 deposit can control a $1,000 position.',
        'MARGIN is the collateral you put up to open a leveraged position — it\'s the "skin in the game" the broker/exchange holds against the borrowed amount.',
        'Leverage doesn\'t just amplify gains — it amplifies losses by the exact same factor. At 10x leverage, a 10% adverse move against you wipes out 100% of your margin. This is the single most important thing to internalize before ever touching leverage.',
        'A LIQUIDATION (or margin call) happens when your losses eat through your margin — the exchange automatically closes your position, often at the worst possible moment, to prevent your account from going negative.',
        'Forex and futures markets commonly involve leverage by default. Crypto exchanges often offer very high leverage (20x, 50x, even 100x) that is genuinely dangerous for beginners — the higher the leverage, the smaller the price move needed to wipe you out.',
        'A reasonable rule for anyone new to leverage: start at 1x-2x, if at all, until you\'ve proven you can manage risk consistently on an unleveraged account first. There is no rush — the market will still be there.',
      ],
      quiz: {
        question: 'At 10x leverage, roughly how much of an adverse price move would wipe out 100% of your margin?',
        options: ['100%', '50%', '10%', '1%'],
        correctIndex: 2,
      },
    },
    {
      id: 'b_volatility',
      title: 'Volatility: How Much a Price Actually Moves',
      icon: '🌪️',
      body: [
        'VOLATILITY measures how much and how fast an asset\'s price swings over a given period — it\'s a measure of movement, not direction. A highly volatile asset can rally or crash hard in a short time; a low-volatility asset drifts slowly.',
        'Crypto and small-cap stocks tend to be more volatile than large-cap stocks or major forex pairs. More volatility means bigger potential gains — and bigger potential losses — on the same position size.',
        'Volatility isn\'t constant. It clusters around news events, earnings releases, economic data, and session opens, then often calms back down. A quiet, tight-range chart can be the calm before a volatile breakout.',
        'Position sizing should account for volatility: the same dollar amount risked on a highly volatile asset needs a wider stop-loss (and therefore usually a smaller position size) than the same risk on a calmer asset, to avoid getting stopped out by normal noise.',
        'A useful mental model: think of volatility as the "speed" of the market. Trading a fast, volatile market with the same instincts you\'d use on a slow, calm one is a common way beginners get shaken out of good trades or blown out of bad ones.',
      ],
      quiz: {
        question: 'High volatility means an asset\'s price is...',
        options: ['Guaranteed to go up', 'Moving a lot, in either direction', 'Not tradeable', 'Always low-risk'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_what_moves_price',
      title: 'What Actually Moves Prices',
      icon: '🔄',
      body: [
        'At the most basic level, every price move comes down to SUPPLY AND DEMAND: more aggressive buyers than sellers at a moment pushes price up; more aggressive sellers than buyers pushes it down.',
        'NEWS AND EVENTS shift that balance fast — earnings reports for stocks, interest rate decisions and economic data (jobs reports, inflation prints) for forex and indices, protocol upgrades or regulatory news for crypto.',
        'MACRO CONDITIONS matter too: interest rates, inflation, and overall economic growth affect entire asset classes at once, not just one symbol — this is why stocks, crypto, and forex sometimes move together during major macro news, even though they\'re "different markets."',
        'MARKET SENTIMENT — the collective mood of participants, from euphoric to fearful — can push prices well beyond what fundamentals alone would justify, in both directions. This is a large part of why markets overshoot at tops and bottoms.',
        'LARGE PARTICIPANTS (institutions, whales, big funds) can move price simply by the size of their own orders, independent of any "reason" — this is part of why price sometimes moves before news is public, and why volume is worth watching alongside price.',
      ],
      quiz: {
        question: 'At the most basic level, price moves because of...',
        options: ['Random chance only', 'The balance of supply and demand', 'The color of the candles', 'App notifications'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_glossary',
      title: 'Trading Glossary: Terms You\'ll See Everywhere',
      icon: '📖',
      body: [
        'PIP: the smallest standard price move in forex (usually the 4th decimal place, e.g. 1.1050 → 1.1051 is 1 pip). TICK: the smallest price increment in stocks/futures.',
        'SLIPPAGE: the difference between the price you expected and the price you actually got filled at, usually from fast-moving or illiquid markets.',
        'ATH / ATL: All-Time High / All-Time Low — the highest or lowest price an asset has ever traded at.',
        'BULL MARKET: a sustained period of rising prices and optimism. BEAR MARKET: a sustained period of falling prices and pessimism.',
        'DIP: a short-term price decline within a broader uptrend. "Buy the dip" means buying during that pullback, betting the uptrend resumes.',
        'ATH CHASING / FOMO: buying an asset because it\'s already risen sharply and you\'re afraid of missing further gains — historically one of the worst-timed entry patterns.',
        'DRAWDOWN: the decline from a peak account value to a subsequent low point, usually expressed as a percentage — a core measure of how much pain a strategy puts you through.',
      ],
      quiz: {
        question: 'A "bear market" refers to a sustained period of...',
        options: ['Rising prices', 'Falling prices', 'No price movement', 'Only crypto trading'],
        correctIndex: 1,
      },
    },
    {
      id: 'b_fees_costs',
      title: 'The Hidden Costs of Trading',
      icon: '🧾',
      body: [
        'Beyond the bid-ask spread, most trading involves COMMISSIONS or trading fees — a flat fee or a percentage of trade value charged by the broker/exchange on each transaction.',
        'Crypto exchanges often charge a "maker" fee (for orders that add liquidity, like limit orders) and a "taker" fee (for orders that remove liquidity, like market orders) — makers are usually charged less to encourage limit orders.',
        'Leveraged and overnight positions can also accrue FUNDING RATES or SWAP FEES — a periodic cost (or occasionally a credit) for holding a leveraged position open past a certain time, especially common in forex and crypto perpetual futures.',
        'These costs seem small individually but compound with frequency. A strategy that trades constantly needs a meaningfully higher edge just to overcome fees, compared to a strategy that trades occasionally with the same win rate.',
        'Always factor total cost — spread + commission + any overnight fees — into whether a trade actually makes sense, not just whether the price moved in your favor.',
      ],
      quiz: {
        question: 'A strategy that trades very frequently needs a higher edge mainly because of...',
        options: ['Compounding fees and spread costs eating into each trade', 'Charts updating too slowly', 'Weekends being closed', 'Leverage always being required'],
        correctIndex: 0,
      },
    },
    {
      id: 'b_paper_trading',
      title: 'Why Practice Trading Actually Matters',
      icon: '🎮',
      body: [
        'Paper trading (practicing with simulated money, like GamerTrades\' default portfolios) lets you make real mistakes — bad entries, ignored stop-losses, emotional decisions — without losing real capital while you\'re still building the pattern-recognition skills that take time to develop.',
        'The goal of practice trading isn\'t to "win" a fake portfolio — it\'s to build reps: enough repetitions of reading a chart, deciding, and seeing the outcome that your instincts start to match reality.',
        'A common trap is treating practice money completely differently than you would real money — taking wildly oversized risks "because it\'s not real." That defeats the purpose. Treat your practice portfolio\'s position sizing and risk rules exactly as you would a real account, so the habits actually transfer.',
        'Journaling your practice trades (why you entered, what you expected, what actually happened) turns raw reps into structured learning — and GamerTrades\' Trade History and AI Coach feedback exist specifically to close that loop.',
        'Nobody starts profitable. The realistic goal of the practice phase is to reach consistency: understanding why a trade worked or didn\'t, not just whether it did.',
      ],
      quiz: {
        question: 'The main purpose of paper/practice trading is to...',
        options: ['Guarantee future real-money profits', 'Build pattern recognition and habits without risking real capital', 'Avoid ever needing risk management', 'Skip learning market fundamentals'],
        correctIndex: 1,
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
    {
      id: 'i_chart_patterns',
      title: 'Classic Chart Patterns',
      icon: '🔺',
      body: [
        'Chart patterns are recurring shapes formed by price action that traders use to anticipate what might happen next — they work because enough market participants recognize and react to the same shapes.',
        'DOUBLE TOP / DOUBLE BOTTOM: price tests a level twice and fails to break through, suggesting a reversal. A double top after an uptrend is bearish; a double bottom after a downtrend is bullish.',
        'HEAD AND SHOULDERS: three peaks, with the middle one (the "head") higher than the two outer ones (the "shoulders") — a classic bearish reversal pattern when it completes at the top of an uptrend. Upside-down, it\'s an "inverse head and shoulders," a bullish reversal.',
        'TRIANGLES (ascending, descending, symmetrical): price coils into a narrowing range as buyers and sellers compress against each other, usually resolving in a breakout — the direction often, but not always, continues the prior trend.',
        'FLAGS AND PENNANTS: brief, tight consolidations after a sharp move, resembling a small flag on a pole — usually a pause before the prior trend continues.',
        'No pattern is a guarantee. Treat them as probabilities that shift the odds, best combined with volume, support/resistance, and the broader trend rather than traded in isolation.',
      ],
      quiz: {
        question: 'A "head and shoulders" pattern completing at the top of an uptrend is typically read as...',
        options: ['A bullish continuation', 'A bearish reversal signal', 'Guaranteed to fail', 'Only relevant to forex'],
        correctIndex: 1,
      },
    },
    {
      id: 'i_multi_timeframe',
      title: 'Multiple Timeframe Analysis',
      icon: '🔬',
      body: [
        'Multiple timeframe analysis means checking more than one chart timeframe before making a decision — typically a higher timeframe for context, and a lower one for precise timing.',
        'A common approach: check the daily or 4-hour chart to establish the dominant trend, then drop to the 15-minute or 1-hour chart to time an entry that aligns with that higher-timeframe direction.',
        'Trading against the higher-timeframe trend using a lower-timeframe signal is one of the most common ways traders get caught on the wrong side of a move — the lower timeframe pattern might be real, but it\'s fighting a much bigger current.',
        'A useful habit: before opening a trade, ask "what does this look like one timeframe up?" If a bullish setup on the 15-minute chart is happening right into major resistance on the daily chart, that context changes how much conviction the trade deserves.',
        'You don\'t need more than 2-3 timeframes in play at once — trying to reconcile five different timeframes usually creates conflicting signals and analysis paralysis rather than clarity.',
      ],
      quiz: {
        question: 'The main benefit of checking a higher timeframe before entering on a lower one is...',
        options: ['It guarantees the trade wins', 'It confirms your entry aligns with the dominant trend', 'It removes the need for a stop-loss', 'It is required by every broker'],
        correctIndex: 1,
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
    {
      id: 'a_bollinger_bands',
      title: 'Bollinger Bands & Volatility Squeezes',
      icon: '🎈',
      body: [
        'Bollinger Bands plot a moving average (usually 20-period) with two bands above and below it, set a certain number of standard deviations away — they expand and contract with volatility.',
        'When the bands are TIGHT (squeezed close together), it signals unusually low volatility — often a period of consolidation that historically precedes an explosive move in either direction.',
        'When price rides along the OUTER band during a strong trend, that\'s often a sign of trend strength, not automatically "overbought" or "oversold" the way it might look at first glance.',
        'A common strategy: watch for a squeeze, then trade the direction of the eventual breakout once price closes decisively outside a band, ideally with a volume increase confirming it.',
        'Bollinger Bands work best combined with another indicator (like RSI or volume) rather than alone — band touches by themselves generate a lot of false signals in trending markets.',
      ],
      quiz: {
        question: 'A tight Bollinger Band "squeeze" typically precedes...',
        options: ['Guaranteed sideways action forever', 'A period of unusually low volatility, often followed by a bigger move', 'A market holiday', 'Nothing meaningful'],
        correctIndex: 1,
      },
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
    {
      id: 'e_drawdown',
      title: 'Drawdown & The Math of Recovery',
      icon: '📉',
      body: [
        'A drawdown is the decline from an account\'s peak value to a subsequent low, usually shown as a percentage — it\'s the standard way to measure how much pain a strategy actually puts you through, separate from its average return.',
        'The math of recovery is brutally asymmetric: a 10% loss only needs an 11% gain to recover. A 50% loss needs a 100% gain just to get back to even. A 90% loss needs a 900% gain. Losses compound against you far faster than they compound in your favor.',
        'This asymmetry is the entire argument for strict risk management — it isn\'t about being overly cautious, it\'s that avoiding deep drawdowns is mathematically far more important to long-term survival than any single winning trade.',
        'Professional traders and funds often set hard drawdown limits (e.g. "stop trading for the week if down 5%") specifically to avoid the emotional spiral of trying to force back losses with bigger, riskier trades.',
        'When evaluating any strategy — yours or someone else\'s — max drawdown matters at least as much as average return. A strategy that returns 30%/year with a 60% max drawdown is a very different risk profile than one returning 15%/year with a 10% max drawdown.',
      ],
      quiz: {
        question: 'After a 50% loss, what gain is needed just to get back to break-even?',
        options: ['50%', '75%', '100%', '25%'],
        correctIndex: 2,
      },
    },
  ],
};

export function lessonsForLevel(level: SkillLevel): Lesson[] {
  return CURRICULUM[level];
}

export const QUIZ_SIZE = 5;
const QUIZ_PASS_FRACTION = 0.8;
const TRADE_CHALLENGE_TARGET = 3;

export interface ProfileLike {
  completed_lessons: string[];
  quiz_passed_levels: string[];
  trade_passed_levels: string[];
}

export interface TopicStat {
  correct: number;
  attempts: number;
}

export type TopicStats = Record<string, TopicStat>;

/** The topic pool (id + title) the AI quiz agent can pick from for a level. */
export function topicsForLevel(level: SkillLevel): { id: string; title: string }[] {
  return CURRICULUM[level].map(l => ({ id: l.id, title: l.title }));
}

/** Records one answered AI-quiz question's result against a topic's running accuracy (used for adaptive difficulty). */
export async function recordQuizTopicResult(userId: string, topicId: string, correct: boolean, currentStats: TopicStats): Promise<TopicStats> {
  const prev = currentStats[topicId] ?? { correct: 0, attempts: 0 };
  const next: TopicStats = {
    ...currentStats,
    [topicId]: { correct: prev.correct + (correct ? 1 : 0), attempts: prev.attempts + 1 },
  };
  const { error } = await supabase.from('profiles').update({ quiz_topic_stats: next }).eq('id', userId);
  if (error) throw error;
  return next;
}

/** All lessons completed for this level. */
export function isLevelComplete(profile: ProfileLike, level: SkillLevel): boolean {
  return CURRICULUM[level].every(l => profile.completed_lessons.includes(l.id));
}

export function isQuizPassed(profile: ProfileLike, level: SkillLevel): boolean {
  return profile.quiz_passed_levels.includes(level);
}

export function isTradeChallengePassed(profile: ProfileLike, level: SkillLevel): boolean {
  return profile.trade_passed_levels.includes(level);
}

export function isLevelMastered(profile: ProfileLike, level: SkillLevel): boolean {
  return isLevelComplete(profile, level) && isQuizPassed(profile, level) && isTradeChallengePassed(profile, level);
}

/** Beginner is always open; every other level requires the previous one fully mastered. */
export function isLevelUnlocked(profile: ProfileLike, level: SkillLevel): boolean {
  const idx = SKILL_LEVELS.indexOf(level);
  if (idx <= 0) return true;
  return isLevelMastered(profile, SKILL_LEVELS[idx - 1]);
}

export function quizPassThreshold(level: SkillLevel): number {
  return Math.ceil(Math.min(QUIZ_SIZE, CURRICULUM[level].length) * QUIZ_PASS_FRACTION);
}


export const TRADE_CHALLENGE_TARGET_CORRECT = TRADE_CHALLENGE_TARGET;

const LEVEL_XP_BONUS = 150;

/** Records a passing quiz attempt for a level (idempotent) and awards a one-time XP bonus. */
export async function passQuiz(userId: string, level: SkillLevel, currentPassed: string[]): Promise<string[]> {
  if (currentPassed.includes(level)) return currentPassed;
  const next = [...currentPassed, level];
  const { error } = await supabase.from('profiles').update({ quiz_passed_levels: next }).eq('id', userId);
  if (error) throw error;

  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  if (profile) await supabase.from('profiles').update({ xp: (profile as { xp: number }).xp + LEVEL_XP_BONUS }).eq('id', userId);

  await logEvent(userId, 'skill_quiz_passed', { level });
  return next;
}

/** Records a passed live Trade-with-AI challenge for a level (idempotent) and awards a one-time XP bonus. */
export async function passTradeChallenge(userId: string, level: SkillLevel, currentPassed: string[]): Promise<string[]> {
  if (currentPassed.includes(level)) return currentPassed;
  const next = [...currentPassed, level];
  const { error } = await supabase.from('profiles').update({ trade_passed_levels: next }).eq('id', userId);
  if (error) throw error;

  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  if (profile) await supabase.from('profiles').update({ xp: (profile as { xp: number }).xp + LEVEL_XP_BONUS }).eq('id', userId);

  await logEvent(userId, 'skill_trade_challenge_passed', { level });
  return next;
}

const LESSON_XP = 25;
const CHART_CLASSROOM_XP = 8;

/** Awards a small XP bump for a correct live Chart Classroom answer. No mastery/gating side effects — pure practice reps. */
export async function awardChartClassroomXp(userId: string): Promise<void> {
  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  if (profile) await supabase.from('profiles').update({ xp: (profile as { xp: number }).xp + CHART_CLASSROOM_XP }).eq('id', userId);
  await logEvent(userId, 'chart_classroom_correct');
}

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
