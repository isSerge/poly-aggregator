import { beforeEach, afterEach } from 'node:test';
import { logger } from '../../logger.js';
import { DatabaseManager } from '../../db/db.js';
import { existsSync, rmSync } from 'fs';

export const TEST_DB_PATH = './test.db';

export function setupTest() {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    logger.info('Setting up test environment');
    process.env.NODE_ENV = 'test';
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH);
    }
    dbManager = await DatabaseManager.create(TEST_DB_PATH);
  });

  afterEach(() => {
    logger.info('Cleaning up test environment');
    dbManager?.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH);
    }
  });

  return {
    getDbManager: () => dbManager,
  };
}
