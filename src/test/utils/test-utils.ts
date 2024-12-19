import { beforeEach, afterEach } from 'node:test';
import { logger } from '../../logger.js';
import { DatabaseManager } from '../../db/db.js';

export function setupTest() {
  let dbManager: DatabaseManager;

  beforeEach(() => {
    logger.info('Setting up test environment');
    logger.level = 'silent'; // Disable logging
    process.env.NODE_ENV = 'test';
    dbManager = new DatabaseManager(':memory:'); // Use in-memory DB
  });

  afterEach(() => {
    logger.info('Cleaning up test environment');
    logger.level = 'info'; // Re-enable logging
    dbManager?.close();
    // No need to delete in-memory DB
  });

  return {
    getDbManager: () => dbManager,
  };
}
