export interface LegalSection {
  heading: string;
  body: string;
}

export const LEGAL_UPDATED = 'July 2026';

export const DISCLAIMER_TEXT =
  'GamerTrades is a simulated paper-trading game for education and entertainment. All balances, trades, ' +
  'and P&L are virtual — no real money is ever deposited, traded, or paid out. Nothing in this app is ' +
  'financial, investment, or trading advice, including the AI Market Analyst feature. Do not make real ' +
  'investment decisions based on this app.';

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'What this app is',
    body:
      'GamerTrades is a gamified paper-trading simulator. It uses virtual currency only — there is no real ' +
      'money, no payment processing for trades, and no way to withdraw funds.',
  },
  {
    heading: 'Information we collect',
    body:
      'Account info: email address and a username you choose, used to create and secure your account. ' +
      'Gameplay data: your simulated trades, positions, goals, XP, achievements, and in-app activity, so we ' +
      'can show your stats and leaderboard standing. Friend and battle data: friend requests and PvP match ' +
      'results between you and other users you choose to interact with.',
  },
  {
    heading: 'AI Market Analyst',
    body:
      'When you run an analysis, the symbol you selected and a summary of current technical signals are sent ' +
      'to Anthropic\'s Claude API to generate a research summary. Recent public news headlines for that symbol ' +
      'are also fetched from NewsAPI.org. No personal account information is included in these requests.',
  },
  {
    heading: 'Subscriptions and payment',
    body:
      'GamerTrades offers optional paid subscription tiers (Pro / Legend) that unlock additional features. ' +
      'Subscriptions are never virtual-currency purchases — they are billed by Stripe, our payment processor. ' +
      'If you subscribe, Stripe collects and processes your payment details (such as card information) and your ' +
      'email address directly; we never see or store your full card number. We receive only your subscription ' +
      'status and Stripe customer/subscription IDs from Stripe so we can grant access to paid features. See ' +
      'Stripe\'s own privacy policy at stripe.com/privacy for how they handle payment data.',
  },
  {
    heading: 'How we use your data',
    body:
      'Solely to operate the app: authenticate you, store your simulated portfolio and progress, power the ' +
      'leaderboard and friends/battle features, generate AI analyses you request, and process subscription ' +
      'billing. We do not sell your data or use it for third-party advertising.',
  },
  {
    heading: 'Where data is stored',
    body:
      'All data is stored in a Supabase (PostgreSQL) database with row-level security, meaning your data is only ' +
      'accessible to your own authenticated account (and, for social features, to users you\'ve chosen to friend ' +
      'or battle).',
  },
  {
    heading: 'Third parties',
    body:
      'We use Supabase for authentication and data storage, Anthropic for AI-generated analysis, NewsAPI.org for ' +
      'news headlines, and Stripe for subscription payment processing. Each processes data only as needed to ' +
      'provide their service to this app.',
  },
  {
    heading: 'Account deletion',
    body:
      'You can permanently delete your account and all associated data at any time from Profile → Danger Zone → ' +
      'Delete Account. This immediately and irreversibly removes your profile, trades, positions, goals, ' +
      'activity history, friendships, and battle records.',
  },
  {
    heading: 'Children',
    body: 'This app is not directed at children under 13, and we do not knowingly collect data from them.',
  },
  {
    heading: 'Contact',
    body: 'Questions about this policy or your data can be sent to the app developer through the App Store listing.',
  },
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: 'Simulated trading only',
    body:
      'GamerTrades is an educational and entertainment app. All trading, balances, positions, and P&L are entirely ' +
      'simulated with virtual currency. No real money is ever involved — you cannot deposit, withdraw, wager, or ' +
      'win real money or anything of monetary value through this app.',
  },
  {
    heading: 'Not financial advice',
    body:
      'Nothing in this app — including price data, strategy signals, the AI Market Analyst\'s research summaries, ' +
      'and any "buy," "sell," or verdict language — constitutes financial, investment, or trading advice. Market ' +
      'data may be simulated or delayed. Do not use this app as the basis for real-world investment decisions.',
  },
  {
    heading: 'Your account',
    body:
      'You are responsible for the accuracy of the information you provide and for keeping your login credentials ' +
      'secure. You must be able to lawfully use this app in your jurisdiction.',
  },
  {
    heading: 'Acceptable use',
    body:
      'Do not use the app to harass other users, attempt to access another user\'s account, reverse engineer the ' +
      'service, or use it in any way that violates applicable law.',
  },
  {
    heading: 'AI-generated content',
    body:
      'The AI Market Analyst uses a third-party language model and live news data. Its output can be incomplete, ' +
      'outdated, or wrong. It is provided for educational exploration only, with no guarantee of accuracy.',
  },
  {
    heading: 'Account deletion',
    body: 'You may delete your account at any time from Profile → Danger Zone → Delete Account, which permanently removes your data.',
  },
  {
    heading: 'No warranty',
    body: 'The app is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.',
  },
  {
    heading: 'Changes',
    body: 'These terms may be updated as the app evolves. Continued use after an update means you accept the revised terms.',
  },
];
