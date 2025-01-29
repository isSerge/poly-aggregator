import { z } from 'zod';

const ApiChildMarketSchema = z.object({
  id: z.string(),
  question: z.string(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format for endDate',
    })
    .optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for startDate',
  }),
  outcomes: z.string().transform((str) => JSON.parse(str) as string[]),
  outcomePrices: z.string().transform((str) => JSON.parse(str) as string[]),
  volume: z
    .string()
    .transform((str) => parseFloat(str))
    .optional(),
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
  active: z.boolean(),
  closed: z.boolean(),
  liquidity: z.number(),
  volume: z.number().optional(),
  openInterest: z.number().optional(),
  createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for createdAt',
  }),
  updatedAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format for updatedAt',
  }),
  volume24hr: z.number().optional(),
  markets: z.array(ApiChildMarketSchema),
});

export const ApiParentMarketArraySchema = z.array(ApiParentMarketSchema);

export type ApiParentMarket = z.infer<typeof ApiParentMarketSchema>;
export type ApiChildMarket = z.infer<typeof ApiChildMarketSchema>;
