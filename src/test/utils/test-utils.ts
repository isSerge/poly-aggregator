import { beforeEach, afterEach } from 'node:test';
import { logger } from '../../logger.js';

export function setupTest() {
  beforeEach(() => {
    logger.info('Setting up test environment');
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    logger.info('Cleaning up test environment');
  });
}
