import { logger } from './logger.js';

export const safeJSONParse = <T>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString) as T; // Cast to T
  } catch (error) {
    handleError(error, 'Error parsing JSON');
    return null; // Return null or handle as needed
  }
};

export const handleError = (error: unknown, context: string) => {
  if (error instanceof Error) {
    logger.error(`${context}: ${error.message}`);
  } else {
    logger.error(`${context}: ${String(error)}`);
  }
};
