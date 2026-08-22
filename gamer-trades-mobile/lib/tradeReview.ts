import { supabase } from './supabase';
import { DbTrade } from './trading';
import { SkillLevel } from './curriculum';

export type TradeVerdict = 'good' | 'mixed' | 'bad';

export interface TradeReview {
  verdict: TradeVerdict;
  headline: string;
  whatWentWell: string;
  whatWentWrong: string;
  lesson: string;
}

export async function runTradeReviewAgent(trade: DbTrade, skillLevel: SkillLevel | null): Promise<TradeReview> {
  if (trade.status !== 'closed' || trade.exit_price == null || trade.closed_at == null || trade.pnl == null) {
    throw new Error('Only closed trades can be reviewed');
  }
  const { data, error } = await supabase.functions.invoke('trade-review-agent', {
    body: {
      trade: {
        symbol: trade.symbol,
        direction: trade.direction,
        quantity: trade.quantity,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        pnl: trade.pnl,
        openedAt: trade.opened_at,
        closedAt: trade.closed_at,
      },
      skillLevel: skillLevel ?? 'beginner',
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data as { review: TradeReview }).review;
}
