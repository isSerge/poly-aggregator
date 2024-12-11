import { z } from 'zod';

const ChildMarketSchema = z.object({
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

const ApiTagSchema = z.object({
  id: z.string(),
  label: z.string(),
  slug: z.string(),
  forceShow: z.boolean().optional(),
  publishedAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for publishedAt',
    })
    .optional(),
  createdAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for createdAt',
    })
    .optional(),
  updatedAt: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for updatedAt',
    })
    .optional(),
});

const ApiChildMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
  conditionId: z.string(),
  slug: z.string(),
  resolutionSource: z.string().optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for endDate',
    })
    .optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for startDate',
  }),
  image: z.string().url(),
  icon: z.string().url(),
  description: z.string(),
  outcomes: z.string().transform((str) => JSON.parse(str) as string[]),
  outcomePrices: z.string().transform((str) => JSON.parse(str) as string[]),
  volume: z.string().transform((str) => parseFloat(str)),
  active: z.boolean(),
  closed: z.boolean(),
  createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for createdAt',
  }),
  updatedAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for updatedAt',
  }),
  liquidity: z
    .string()
    .transform((str) => parseFloat(str))
    .optional(),
});

const ApiParentMarketSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  resolutionSource: z.string().optional(),
  startDate: z
    .string()
    .nullable()
    .refine((date) => date === null || !isNaN(Date.parse(date)), {
      message: 'Invalid date format for startDate',
    }),
  creationDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for creationDate',
  }),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for endDate',
    })
    .optional(),
  image: z.string().url(),
  icon: z.string().url(),
  active: z.boolean(),
  closed: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  restricted: z.boolean(),
  liquidity: z.number(),
  volume: z.number(),
  openInterest: z.number().optional(),
  createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for createdAt',
  }),
  updatedAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for updatedAt',
  }),
  volume24hr: z.number(),
  enableOrderBook: z.boolean(),
  markets: z.array(ApiChildMarketSchema),
  tags: z.array(ApiTagSchema),
});

export const ApiParentMarketArraySchema = z.array(ApiParentMarketSchema);

export const MarketRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for start_date',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for end_date',
  }),
  active: z.number().refine((num) => num === 0 || num === 1, {
    message: 'active must be 0 or 1',
  }),
  closed: z.number().refine((num) => num === 0 || num === 1, {
    message: 'closed must be 0 or 1',
  }),
  liquidity: z.number(),
  volume: z.number(),
  parent_market_id: z.string().optional(),
  child_markets_id: z.string().optional(),
  question: z.string().optional(),
  outcomes: z.string().optional(),
  outcome_prices: z.string().optional(),
  child_markets_volume: z.number().optional(),
  child_markets_active: z.number().optional(),
  child_markets_closed: z.number().optional(),
});

export type MarketRow = z.infer<typeof MarketRowSchema>;
export type ApiParentMarket = z.infer<typeof ApiParentMarketSchema>;
export type ApiChildMarket = z.infer<typeof ApiChildMarketSchema>;
export type ApiTag = z.infer<typeof ApiTagSchema>;
export type ChildMarket = z.infer<typeof ChildMarketSchema>;
export type ParentMarket = z.infer<typeof ParentMarketSchema>;
