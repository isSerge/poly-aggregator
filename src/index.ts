import { logger } from './logger.js';
import { config } from './config.js';

export function main() {
  logger.info('Hello World');
  logger.info(config, 'config');
}

main();
