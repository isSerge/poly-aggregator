import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SAMPLE_ENV_VAR: z.string().transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const config = envSchema.parse(process.env);
