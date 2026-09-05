import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Card, PixelText, BodyText } from './ui';
import { colors } from '../lib/theme';

interface Entry {
  q: string;
  a: string;
}

const ENTRIES: Entry[] = [
  {
    q: 'What is "trading," in plain English?',
    a: 'Buying something (a stock, a coin, a currency) because you think its price will go up, then selling it later for more than you paid. That difference is your profit. If the price goes down instead, you lose money.',
  },
  {
    q: 'How do people actually make money from it?',
    a: 'Two ways: BUY LOW, SELL HIGH (called "going long") — you buy first, hoping to sell later at a higher price. Or the reverse, SELL HIGH, BUY BACK LOW (called "going short") — you sell first, hoping to buy it back later at a lower price. Both are just betting on which direction the price moves.',
  },
  {
    q: 'What is a "stock," "crypto," etc.? What are these different markets?',
    a: 'A STOCK is a tiny ownership slice of a real company. CRYPTO is a digital currency like Bitcoin. FOREX is trading one country\'s currency against another\'s. These are just different categories of "things you can buy and sell" — the core idea (buy low, sell high) is the same across all of them.',
  },
  {
    q: 'What does "the market" mean?',
    a: 'It just means the whole system of buyers and sellers agreeing on a price for something, right now, in real time. "The market is up today" means, on average, prices went up. There\'s no single building or website that IS "the market" — it\'s just the ongoing activity of everyone trading.',
  },
  {
    q: 'What is a "position"?',
    a: 'Once you\'ve bought (or sold) something and haven\'t closed it out yet, that\'s called an "open position." Closing it — selling what you bought, or buying back what you sold — is how you lock in your profit or loss.',
  },
  {
    q: 'What is risk, really?',
    a: 'Risk is simply: the price might move against you instead of in your favor, and you lose some or all of what you put in. Nobody can predict the market with certainty — managing risk (like only risking a small amount per trade) is how experienced traders stay in the game long enough to actually improve.',
  },
  {
    q: 'What\'s the point of this app if it\'s not real money?',
    a: 'You get to practice everything — reading charts, placing trades, managing risk, watching what happens — without the fear of losing real money while you\'re still learning. It\'s the same skill-building whether the dollars are real or simulated; the market behavior you\'re learning to read is the same either way.',
  },
  {
    q: 'I still feel lost — where do I actually start?',
    a: 'Head to the Skill Path below (starts at Beginner) — it walks through candlesticks, buy vs. sell, and the different markets step by step, with short quizzes to check you\'ve got it. This page is just the 30-second version to get your bearings first.',
  },
];

/** The absolute-beginner-friendliest explainer in the app -- no quiz, no gating, just plain
 * answers to the questions someone brand new to trading would actually have. Sits at the top
 * of the Learn tab, above everything else, since it's meant to be the very first thing read. */
export default function TradingForDummiesCard() {
  const [expanded, setExpanded] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Card borderColor={colors.green}>
      <Pressable onPress={() => setExpanded(e => !e)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PixelText size={18}>📗</PixelText>
          <View>
            <BodyText color={colors.green} size={13} weight="semibold" glow>TRADING FOR DUMMIES</BodyText>
            <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>The absolute basics, in plain English</BodyText>
          </View>
        </View>
        <BodyText color={colors.muted} size={13}>{expanded ? '▲' : '▼'}</BodyText>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 12 }}>
          {ENTRIES.map((entry, i) => {
            const open = openIndex === i;
            return (
              <View key={i} style={{ borderBottomWidth: i === ENTRIES.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 10 }}>
                <Pressable onPress={() => setOpenIndex(open ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BodyText color={open ? colors.green : colors.text} size={12.5} weight="semibold" style={{ flex: 1 }}>{entry.q}</BodyText>
                  <BodyText color={colors.muted} size={12}>{open ? '−' : '+'}</BodyText>
                </Pressable>
                {open && (
                  <BodyText color={colors.muted} size={12.5} style={{ marginTop: 8, lineHeight: 18 }}>{entry.a}</BodyText>
                )}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
