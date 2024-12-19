import { setupTest } from './utils/test-utils.js';
import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DatabaseManager } from '../db/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseError } from '../errors.js';

// Define __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DatabaseManager', () => {
  const { getDbManager } = setupTest();

  it('should establish a database connection', () => {
    const dbManager = getDbManager();
    assert.ok(dbManager.isHealthy(), 'Database should be healthy');
  });

  it('should create necessary tables', () => {
    const dbManager = getDbManager();
    const db = dbManager.getConnection();

    const tables = ['markets', 'child_markets', 'reports'];
    tables.forEach((table) => {
      const stmt = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`
      );
      const row = stmt.get(table);
      assert.ok(row, `Table ${table} should exist`);
    });
  });

  it('should handle closing the database connection', () => {
    const dbManager = getDbManager();
    assert.ok(dbManager.isHealthy(), 'Database should initially be healthy');
    dbManager.close();
    assert.equal(dbManager.isHealthy(), false, 'Database should be closed');
  });

  it('should ensure directory creation if it does not exist', () => {
    // Define a new DB path in a non-existing directory
    const newDbPath = path.join(__dirname, '../nonexistent_dir/new_test.db');
    const newDir = path.dirname(newDbPath);

    // Ensure the directory does not exist
    if (fs.existsSync(newDir)) {
      fs.rmSync(newDir, { recursive: true, force: true });
    }

    const dbManager = new DatabaseManager(newDbPath);
    assert.ok(fs.existsSync(newDir), 'Directory should be created');
    dbManager.close();

    if (fs.existsSync(newDbPath)) {
      fs.rmSync(newDir, { recursive: true, force: true });
    }
  });

  it('should handle schema initialization errors gracefully', () => {
    // Backup the original readFileSync method
    const originalReadFileSync = fs.readFileSync;

    // Mock readFileSync to throw an error
    fs.readFileSync = () => {
      throw new Error('Simulated readFile error');
    };

    try {
      assert.throws(
        () => new DatabaseManager('nonexistent.db'),
        (error: unknown) =>
          error instanceof DatabaseError &&
          error.message.includes('Simulated readFile error')
      );
    } finally {
      // Restore the original readFileSync method
      fs.readFileSync = originalReadFileSync;
      // remove non-existent db file
      fs.rmSync('nonexistent.db', { force: true });
    }
  });

  it('should throw a DatabaseError when the database connection is unexpectedly closed', () => {
    const dbManager = getDbManager();

    // Simulate an unexpected database connection close
    dbManager['db'].close();

    assert.throws(
      () => dbManager.getConnection(),
      (error) =>
        error instanceof DatabaseError &&
        error.message.includes('Database connection is not open')
    );
  });

  it('should throw a DatabaseError when performing operations after closing the connection', () => {
    const dbManager = getDbManager();

    dbManager.close();

    assert.throws(
      () => {
        try {
          dbManager.getConnection().prepare('SELECT 1').get();
        } catch (err: unknown) {
          if (
            err instanceof TypeError &&
            err.message === 'The database connection is not open'
          ) {
            throw DatabaseError.from(
              err,
              'Failed to get database connection: Database connection is not open'
            );
          }
          throw err;
        }
      },
      (error) =>
        error instanceof DatabaseError &&
        error.message.includes(
          'Failed to get database connection: Database connection is not open'
        )
    );
  });
});
