export interface CryptoProfile {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  launched: string;
  founders: string;
  originStory: string[];
  whatMakesItDifferent: string[];
  funFact: string;
}

/**
 * Simplified, beginner-friendly histories for every crypto asset in the app.
 * Purely educational — no price predictions or investment framing.
 */
export const CRYPTO_PROFILES: CryptoProfile[] = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    icon: '₿',
    color: '#f7931a',
    launched: '2009',
    founders: 'Satoshi Nakamoto (anonymous)',
    originStory: [
      'In October 2008, right in the middle of a global financial crisis, someone using the name "Satoshi Nakamoto" published a short paper describing digital money that didn\'t need a bank or government to work.',
      'A few months later, in January 2009, that idea went live as Bitcoin — the very first cryptocurrency. Nobody has ever confirmed who Satoshi actually is.',
    ],
    whatMakesItDifferent: [
      'Bitcoin was built to be scarce on purpose — only 21 million will ever exist, coded into the system from day one, like a digital version of a limited-edition item.',
      'It runs on a public ledger called a blockchain, maintained by thousands of computers around the world instead of one company or bank.',
    ],
    funFact: 'The first real-world purchase with Bitcoin was two pizzas — 10,000 BTC, paid in 2010. Traders still celebrate "Bitcoin Pizza Day" every May 22nd.',
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    icon: 'Ξ',
    color: '#627eea',
    launched: '2015',
    founders: 'Vitalik Buterin',
    originStory: [
      'A young programmer named Vitalik Buterin thought Bitcoin\'s technology could do more than just send money — it could run entire programs. He wrote up the idea in 2013 at just 19 years old.',
      'Ethereum launched in 2015, introducing "smart contracts" — code that runs automatically on the blockchain with no one able to shut it off or cheat the rules.',
    ],
    whatMakesItDifferent: [
      'Where Bitcoin is mainly digital money, Ethereum is more like a global computer — developers build entire apps on top of it (trading platforms, games, digital art marketplaces).',
      'In 2022, Ethereum completed a massive upgrade called "The Merge," switching how it verifies transactions and cutting its energy use by over 99%.',
    ],
    funFact: 'Ethereum is home to NFTs and most of "DeFi" (decentralized finance) — banking-like services with no actual bank involved.',
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    icon: '◎',
    color: '#00ffa3',
    launched: '2020',
    founders: 'Anatoly Yakovenko',
    originStory: [
      'Former Qualcomm engineer Anatoly Yakovenko published Solana\'s design in 2017, aiming to solve a problem that had frustrated crypto users for years: blockchains were slow and expensive.',
      'Solana\'s mainnet went live in 2020, built around a technique called "Proof of History" that lets it timestamp transactions in a way that makes verifying them much faster.',
    ],
    whatMakesItDifferent: [
      'Solana can process thousands of transactions per second for a tiny fraction of a cent — compared to a few transactions per second on Bitcoin.',
      'That speed has made it a favorite for trading apps, games, and NFT marketplaces that need things to feel instant.',
    ],
    funFact: 'Solana has suffered several high-profile network outages, which its community jokingly calls "up-time meditation breaks."',
  },
  {
    symbol: 'XRP/USD',
    name: 'XRP',
    icon: '✕',
    color: '#00aae4',
    launched: '2012',
    founders: 'Jed McCaleb, Chris Larsen, Arthur Britto',
    originStory: [
      'XRP was created in 2012 by a small team who then formed the company Ripple, with a very specific target: fixing how banks send money to each other across countries.',
      'Traditional international bank transfers can take days and cost real money in fees — XRP was designed to settle in seconds for a fraction of a cent.',
    ],
    whatMakesItDifferent: [
      'Unlike Bitcoin, XRP isn\'t "mined." All 100 billion XRP were created at launch, and the supply is released gradually by Ripple over time.',
      'XRP has spent years tied up in a high-profile U.S. lawsuit over whether it should be regulated like a security — a legal fight that shaped how the whole industry thinks about that question.',
    ],
    funFact: 'A single XRP transaction typically settles in 3-5 seconds — one of the fastest of any major crypto asset.',
  },
  {
    symbol: 'DOGE/USD',
    name: 'Dogecoin',
    icon: '🐕',
    color: '#c2a633',
    launched: '2013',
    founders: 'Billy Markus, Jackson Palmer',
    originStory: [
      'Dogecoin started in December 2013 as a joke. Two software engineers, Billy Markus and Jackson Palmer, slapped the popular "Doge" Shiba Inu meme onto a copy of an existing cryptocurrency, mostly to poke fun at how seriously the crypto world was taking itself.',
      'The joke took on a life of its own — the Dogecoin community became known for being unusually friendly and for raising money for real causes, like sponsoring a driver in the 2014 NASCAR season and funding clean water wells in Kenya.',
    ],
    whatMakesItDifferent: [
      'Unlike Bitcoin, Dogecoin has no maximum supply — new coins keep getting created forever, which keeps it far cheaper per coin.',
      'Its identity has always been more about community and culture than technology — it\'s become a symbol of crypto\'s lighter, meme-driven side.',
    ],
    funFact: 'Elon Musk has publicly joked about and promoted Dogecoin for years, at times moving its price with a single tweet.',
  },
  {
    symbol: 'ADA/USD',
    name: 'Cardano',
    icon: '₳',
    color: '#0033ad',
    launched: '2017',
    founders: 'Charles Hoskinson',
    originStory: [
      'Charles Hoskinson, one of Ethereum\'s original co-founders, left to start his own project in 2015 with a different philosophy: build slower, but build on peer-reviewed academic research instead of moving fast and fixing things later.',
      'Cardano launched in 2017, named after 16th-century Italian mathematician Gerolamo Cardano. Its currency, ADA, is named after 19th-century mathematician Ada Lovelace, often called the first computer programmer.',
    ],
    whatMakesItDifferent: [
      'Every major upgrade to Cardano is expected to go through academic-style research papers and peer review before it ships — a notably slower, more formal process than most of the industry.',
      'It uses a proof-of-stake system designed from the start to use very little energy compared to Bitcoin\'s mining-based model.',
    ],
    funFact: 'Cardano is developed in phases named after historical eras and figures — its roadmap has literally been split into named "epochs."',
  },
  {
    symbol: 'AVAX/USD',
    name: 'Avalanche',
    icon: '🏔️',
    color: '#e84142',
    launched: '2020',
    founders: 'Emin Gün Sirer',
    originStory: [
      'Cornell professor and longtime blockchain researcher Emin Gün Sirer founded Ava Labs to build a faster alternative to existing blockchains, launching Avalanche\'s mainnet in September 2020.',
      'The project is named for its "Avalanche consensus" method — a new way for computers on the network to agree on what happened, inspired by how information spreads through a crowd.',
    ],
    whatMakesItDifferent: [
      'Avalanche can finalize transactions in under two seconds, and lets developers spin up their own custom mini-blockchains (called "subnets") tailored to specific apps.',
      'It positions itself as a platform for building entire financial systems and games, not just as a single currency.',
    ],
    funFact: 'Avalanche\'s consensus mechanism is loosely inspired by how rumors or diseases spread through a population — fast, and hard to fake out.',
  },
  {
    symbol: 'LINK/USD',
    name: 'Chainlink',
    icon: '🔗',
    color: '#375bd2',
    launched: '2017',
    founders: 'Sergey Nazarov, Steve Ellis',
    originStory: [
      'Sergey Nazarov and Steve Ellis noticed a core problem in 2017: blockchains are great at running code, but they can\'t see anything happening in the outside world — no stock prices, no weather, no sports scores — on their own.',
      'Chainlink launched to solve exactly that, building secure "oracles" — services that feed real-world data into blockchain apps so smart contracts can react to real events.',
    ],
    whatMakesItDifferent: [
      'Chainlink isn\'t trying to be a currency people spend day-to-day — it\'s infrastructure that other crypto projects plug into, similar to how the internet needs DNS working quietly in the background.',
      'It\'s used to feed live price data into a large share of the DeFi (decentralized finance) apps built on Ethereum and other blockchains.',
    ],
    funFact: 'Chainlink has secured hundreds of billions of dollars in value across other crypto projects that depend on its data feeds being accurate.',
  },
];

export function getCryptoProfile(symbol: string): CryptoProfile | undefined {
  return CRYPTO_PROFILES.find(c => c.symbol === symbol);
}
