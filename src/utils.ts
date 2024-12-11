import { logger } from './logger.js';

export const handleError = (error: unknown, context: string) => {
  if (error instanceof Error) {
    logger.error(`${context}: ${error.message}`);
  } else {
    logger.error(`${context}: ${String(error)}`);
  }
};
