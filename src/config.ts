import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  GAMMA_API_URL: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  GEMINI_API_KEY: z.string(),
  CRON_SCHEDULE: z.string().default('0 */12 * * *'), // Every 12 hours
});

export const config = envSchema.parse(process.env);
