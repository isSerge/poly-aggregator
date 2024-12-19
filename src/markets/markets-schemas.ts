import { z } from 'zod';

// SQLite row types
export interface SqliteMarket {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  liquidity: number;
  volume: number;
  created_at: string;
  updated_at: string;
}

export interface SqliteChildMarket {
  id: string;
  parent_market_id: string;
  question: string;
  outcomes: string; // JSON string
  outcome_prices: string; // JSON string
  volume: number;
  created_at: string;
  updated_at: string;
}

// Zod schemas for validation
const ChildMarketSchema = z.object({
  id: z.string(),
  parent_market_id: z.string(),
  question: z.string(),
  outcomes: z.array(z.string()),
  outcomePrices: z.array(z.string()),
  volume: z.number().nonnegative(),
  created_at: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for createdAt',
    })
    .optional(),
  updated_at: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for updatedAt',
    })
    .optional(),
});

export const ParentMarketSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for startDate',
  }),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for endDate',
    })
    .nullable()
    .optional(),
  liquidity: z.number().nonnegative(),
  volume: z.number().nonnegative(),
  childMarkets: z.array(ChildMarketSchema),
  created_at: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for createdAt',
    })
    .optional(),
  updated_at: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for updatedAt',
    })
    .optional(),
});

// Schema for database row validation
export const MarketRowSchema = z.object({
  market_id: z.string(),
  title: z.string(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for start_date',
  }),
  end_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for end_date',
    })
    .nullable()
    .optional(),
  liquidity: z.number().nonnegative(),
  volume: z.number().nonnegative(),
  created_at: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for created_at',
  }),
  updated_at: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for updated_at',
  }),
  // Child market fields (when joined)
  child_id: z.string().nullable().optional(),
  question: z.string().nullable().optional(),
  outcomes: z.string().nullable().optional(), // JSON string
  outcome_prices: z.string().nullable().optional(), // JSON string
  child_volume: z.number().nonnegative().nullable().optional(),
});

// Export types
export type ChildMarket = z.infer<typeof ChildMarketSchema>;
export type ParentMarket = z.infer<typeof ParentMarketSchema>;
export type MarketRow = z.infer<typeof MarketRowSchema>;
