import { beforeEach, afterEach } from 'node:test';
import { logger } from '../../logger.js';

export function setupTest() {
  beforeEach(() => {
    logger.info('Setting up test environment');
    // Setup test environment
    process.env.GAMMA_API_URL = 'https://mock.gamma.api.url';
    process.env.GEMINI_API_KEY = 'mock_gemini_api_key';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    logger.info('Cleaning up test environment');
  });
}
