import { z } from 'zod';

const ChildMarketSchema = z.object({
  parent_market_id: z.string(), // Unique identifier
  id: z.string(), // Unique identifier
  question: z.string(), // Market-specific question
  outcomes: z.array(z.string()), // Parsed outcomes array
  outcomePrices: z.array(z.string()), // Parsed outcome prices
  volume: z.number(), // Volume in numeric format
  active: z.boolean(), // Active status
  closed: z.boolean(), // Closed status
});

export const ParentMarketSchema = z.object({
  id: z.string(), // Unique identifier for tracking
  title: z.string(), // Market title/question
  startDate: z.string().nullable(), // ISO string (optional)
  endDate: z.string().optional(), // ISO string (optional)
  active: z.boolean(), // Active status
  closed: z.boolean(), // Closed status
  liquidity: z.number(), // Total liquidity
  volume: z.number(), // Total volume
  childMarkets: z.array(ChildMarketSchema), // Array of child markets
});

export const MarketRowSchema = z.object({
  market_id: z.string(),
  title: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  market_active: z.number(),
  market_closed: z.number(),
  liquidity: z.number().nullable(),
  volume: z.number().nullable(),
  child_id: z.string().optional(),
  question: z.string().optional(),
  outcomes: z.string().optional(),
  outcome_prices: z.string().optional(),
  child_volume: z.number().optional(),
  child_active: z.number().optional(),
  child_closed: z.number().optional(),
});

export type MarketRow = z.infer<typeof MarketRowSchema>;
export type ChildMarket = z.infer<typeof ChildMarketSchema>;
export type ParentMarket = z.infer<typeof ParentMarketSchema>;
