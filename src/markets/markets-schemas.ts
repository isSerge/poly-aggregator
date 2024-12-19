import { z } from 'zod';

const ChildMarketSchema = z.object({
  parent_market_id: z.string(),
  id: z.string(),
  question: z.string(),
  outcomes: z.array(z.string()),
  outcomePrices: z.array(z.string()),
  volume: z.number(),
});

export const ParentMarketSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().optional(),
  liquidity: z.number(),
  volume: z.number(),
  childMarkets: z.array(ChildMarketSchema),
});

export const MarketRowSchema = z.object({
  market_id: z.string(),
  title: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  liquidity: z.number().nullable(),
  volume: z.number().nullable(),
  child_id: z.string().nullable().optional(),
  question: z.string().nullable().optional(),
  outcomes: z.string().nullable().optional(),
  outcome_prices: z.string().nullable().optional(),
  child_volume: z.number().nullable().optional(),
});

export type MarketRow = z.infer<typeof MarketRowSchema>;
export type ChildMarket = z.infer<typeof ChildMarketSchema>;
export type ParentMarket = z.infer<typeof ParentMarketSchema>;
