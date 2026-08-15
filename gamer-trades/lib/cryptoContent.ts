export interface CoinInfo {
  symbol: string;
  ticker: string;
  name: string;
  icon: string;
  color: string;
  founded: string;
  founder: string;
  tagline: string;
  history: string[];
  whatItsFor: string;
  funFact: string;
}

export const COINS: CoinInfo[] = [
  {
    symbol: 'BTC/USD',
    ticker: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: '#f7931a',
    founded: '2009',
    founder: 'Satoshi Nakamoto (identity unknown)',
    tagline: 'The original cryptocurrency — digital money nobody controls.',
    history: [
      'In October 2008, someone (or a group) using the name Satoshi Nakamoto published a short paper describing a new kind of money that could move between people directly, with no bank in the middle.',
      'In January 2009, Nakamoto launched the network and created its very first block — tucking in a newspaper headline about a bank bailout as a hint about why Bitcoin needed to exist.',
      'Nakamoto kept working on the project for about a year, then disappeared from public view around 2010 and has never been identified since. Bitcoin kept running without them.',
      'Only 21 million bitcoins will ever exist. That hard cap, plus the fact that no company or government issues it, is why people often call it "digital gold."',
    ],
    whatItsFor: 'Sending money to anyone, anywhere, without a bank — and holding value long-term, similar to gold.',
    funFact: 'The first real-world purchase was two pizzas for 10,000 BTC in 2010 — worth hundreds of millions of dollars today.',
  },
  {
    symbol: 'ETH/USD',
    ticker: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: '#627eea',
    founded: '2015',
    founder: 'Vitalik Buterin',
    tagline: 'A programmable blockchain that runs apps, not just money.',
    history: [
      'Vitalik Buterin, then 19, wrote the Ethereum whitepaper in 2013 after concluding Bitcoin needed a way to run actual programs, not just track balances.',
      'The project raised funding directly from the public in 2014, and the live network launched in July 2015.',
      'Ethereum introduced "smart contracts" — code that runs automatically on the blockchain — which became the foundation for things like decentralized apps, NFTs, and DeFi lending.',
      'In 2022, Ethereum completed "The Merge," switching how it verifies transactions and cutting its energy use by about 99% overnight.',
    ],
    whatItsFor: 'Powering apps — lending platforms, games, NFT marketplaces — that run on code instead of a company\'s servers.',
    funFact: 'Its name nods to "luminiferous ether," the old scientific idea of an invisible medium that fills all of space.',
  },
  {
    symbol: 'SOL/USD',
    ticker: 'SOL',
    name: 'Solana',
    icon: '◎',
    color: '#14f195',
    founded: '2020',
    founder: 'Anatoly Yakovenko',
    tagline: 'Built for speed — thousands of transactions every second.',
    history: [
      'Former Qualcomm engineer Anatoly Yakovenko published a 2017 whitepaper around an idea called "Proof of History" — a way to timestamp transactions that lets the network process them far faster than most blockchains.',
      'The mainnet went live in 2020, and Solana quickly built a reputation for extremely low fees and fast confirmation times.',
      'It became a hub for NFT projects and blockchain games that need speed, though a handful of network outages in its early years tested the community\'s patience.',
      'Solana has continued shipping upgrades aimed at reliability while keeping its core selling point: transactions that confirm in a fraction of a second.',
    ],
    whatItsFor: 'Apps that need speed and low cost — games, NFT trading, and high-frequency DeFi.',
    funFact: 'It\'s named after Solana Beach, a small California surf town Yakovenko used to visit.',
  },
  {
    symbol: 'XRP/USD',
    ticker: 'XRP',
    name: 'XRP',
    icon: '✕',
    color: '#00aae4',
    founded: '2012',
    founder: 'Chris Larsen, Jed McCaleb & Arthur Britto (Ripple Labs)',
    tagline: 'Built to move money across borders in seconds, not days.',
    history: [
      'XRP was created in 2012 by the founders of Ripple Labs, a company aiming to fix a real problem: international bank transfers that take days and cost a lot in fees.',
      'Unlike Bitcoin, XRP wasn\'t "mined" — the entire supply was created up front and Ripple has released portions of it over time.',
      'Banks and payment companies began testing XRP as a bridge currency for moving value between different currencies almost instantly.',
      'From 2020 to 2023, Ripple fought a major lawsuit with the U.S. SEC over whether XRP counted as a security — a case that shaped how the industry thinks about crypto regulation.',
    ],
    whatItsFor: 'Fast, cheap cross-border payments — settling in seconds instead of the days a bank wire takes.',
    funFact: 'An XRP transaction typically finalizes in 3-5 seconds, regardless of how large it is.',
  },
  {
    symbol: 'DOGE/USD',
    ticker: 'DOGE',
    name: 'Dogecoin',
    icon: '🐕',
    color: '#ba9f33',
    founded: '2013',
    founder: 'Billy Markus & Jackson Palmer',
    tagline: 'Started as a joke, became one of the most traded coins around.',
    history: [
      'In December 2013, software engineers Billy Markus and Jackson Palmer put Dogecoin together in a couple of hours, poking fun at how wild and speculative the crypto space had become.',
      'They used the "Doge" internet meme — a Shiba Inu dog with broken-English captions — as the logo, and never expected it to be taken seriously.',
      'A generous tipping culture grew up around it on Reddit and Twitter, with users sending small amounts of Doge to reward good posts.',
      'It has no maximum supply, unlike Bitcoin, and gained huge mainstream attention after high-profile figures like Elon Musk began tweeting about it.',
    ],
    whatItsFor: 'Originally just for fun and tipping online — now widely traded and occasionally accepted for real purchases.',
    funFact: 'The Shiba Inu in the logo is a real dog named Kabosu, whose photo became one of the most famous memes in internet history.',
  },
  {
    symbol: 'ADA/USD',
    ticker: 'ADA',
    name: 'Cardano',
    icon: '₳',
    color: '#0033ad',
    founded: '2017',
    founder: 'Charles Hoskinson',
    tagline: 'A blockchain built through peer-reviewed academic research.',
    history: [
      'Charles Hoskinson, a co-founder of Ethereum, left that project in 2014 over disagreements about its direction and set out to build something more methodical.',
      'He founded Cardano in 2015 with a different approach: every major change would first be proposed in an academic paper and reviewed by outside researchers before being built.',
      'The network launched in 2017, and its currency ADA was named after Ada Lovelace, the 19th-century mathematician widely considered the first computer programmer.',
      'Cardano rolled out its features in slow, deliberate stages over several years rather than launching everything at once, prioritizing careful testing over speed to market.',
    ],
    whatItsFor: 'Smart contracts and apps, aimed at being especially secure and rigorously tested before features ship.',
    funFact: 'The blockchain itself is named after Gerolamo Cardano, a Renaissance-era mathematician — its currency is named after Ada Lovelace.',
  },
  {
    symbol: 'AVAX/USD',
    ticker: 'AVAX',
    name: 'Avalanche',
    icon: '🏔️',
    color: '#e84142',
    founded: '2020',
    founder: 'Emin Gün Sirer & the Ava Labs team',
    tagline: 'Lets anyone launch their own custom blockchain that still talks to the rest.',
    history: [
      'Cornell professor Emin Gün Sirer, a longtime researcher in distributed systems, published the Avalanche consensus protocol in a 2018-2019 paper.',
      'His team, Ava Labs, launched the mainnet in September 2020, built around confirming transactions in under two seconds.',
      'Avalanche\'s standout idea is "subnets" — separate custom blockchains that projects can spin up for their own needs, while still being able to interact with each other.',
      'That flexibility made it popular with projects that wanted their own dedicated chain without building a blockchain from scratch.',
    ],
    whatItsFor: 'Powering fast transactions and letting businesses or projects launch their own connected blockchain.',
    funFact: 'Transactions on Avalanche typically finalize in under two seconds — among the fastest of any major network.',
  },
  {
    symbol: 'LINK/USD',
    ticker: 'LINK',
    name: 'Chainlink',
    icon: '🔗',
    color: '#2a5ada',
    founded: '2017',
    founder: 'Sergey Nazarov & Steve Ellis',
    tagline: 'Doesn\'t compete with other coins — it feeds them real-world data.',
    history: [
      'Blockchains have a built-in blind spot: their smart contracts can\'t see anything happening outside the chain — no stock prices, no weather, no sports scores — on their own.',
      'Sergey Nazarov and Steve Ellis founded Chainlink in 2017 to solve that "oracle problem" by building a network that securely feeds outside data onto any blockchain.',
      'Instead of trying to replace Bitcoin or Ethereum, Chainlink works alongside them — many DeFi apps you\'d trade on other chains rely on Chainlink behind the scenes for accurate pricing.',
      'It has grown into one of the most widely integrated pieces of crypto infrastructure, even though most users never interact with it directly.',
    ],
    whatItsFor: 'Feeding real-world data (like live prices) into smart contracts so they can react to the outside world accurately.',
    funFact: 'Many of the other coins on this list are traded on DeFi platforms that quietly rely on Chainlink for their price data.',
  },
];

export function getCoin(symbol: string) {
  return COINS.find(c => c.symbol === symbol);
}
