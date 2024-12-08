import { pino } from 'pino';
import { z } from 'zod';

const loggerSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_COLORIZE: z.coerce.boolean().default(true),
  LOG_TRANSLATE_TIME: z.string().default('yyyy-mm-dd HH:MM:ss'),
  LOG_IGNORE: z.string().default('hostname,pid'),
});

const loggerConfig = loggerSchema.parse(process.env);

export const logger = pino({
  level: loggerConfig.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: loggerConfig.LOG_COLORIZE,
      translateTime: loggerConfig.LOG_TRANSLATE_TIME,
      ignore: loggerConfig.LOG_IGNORE,
    },
  },
  // Add environment info
  base: {
    env: process.env.NODE_ENV,
  },
});
