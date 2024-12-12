import { setupTest } from './utils/test-utils.js';

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DatabaseManager } from '../db/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
      const row = stmt.get(table); // Type inferred as any
      assert.ok(row, `Table ${table} should exist`);
    });
  });

  it('should insert and retrieve a market', () => {
    const dbManager = getDbManager();
    const db = dbManager.getConnection();

    const insertStmt = db.prepare(`
      INSERT INTO markets (id, title, active, closed, liquidity, volume)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const marketId = 'market1';
    insertStmt.run(marketId, 'Test Market', 1, 0, 1000.5, 5000.75);

    const selectStmt = db.prepare(`SELECT * FROM markets WHERE id = ?`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const market = selectStmt.get(marketId) as any;

    assert.ok(market, 'Inserted market should be retrieved');
    assert.equal(market.title, 'Test Market');
    assert.equal(market.active, 1);
    assert.equal(market.closed, 0);
    assert.equal(market.liquidity, 1000.5);
    assert.equal(market.volume, 5000.75);
  });

  it('should handle closing the database connection', () => {
    const dbManager = getDbManager();
    assert.ok(dbManager.isHealthy(), 'Database should initially be healthy');
    dbManager.close();
    assert.equal(dbManager.isHealthy(), false, 'Database should be closed');
  });

  it('should insert and retrieve a child market with JSON fields', () => {
    const dbManager = getDbManager();
    const db = dbManager.getConnection();

    const parentMarketId = 'market1';
    // Insert a parent market first
    db.prepare(
      `
      INSERT INTO markets (id, title, active, closed, liquidity, volume)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(parentMarketId, 'Parent Market', 1, 0, 2000, 10000);

    const childMarketId = 'child1';
    const question = 'What is the outcome?';
    const outcomes = JSON.stringify(['Yes', 'No']);
    const outcomePrices = JSON.stringify([1.5, 2.5]);

    const insertStmt = db.prepare(`
      INSERT INTO child_markets (id, parent_market_id, question, outcomes, outcome_prices, volume, active, closed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      childMarketId,
      parentMarketId,
      question,
      outcomes,
      outcomePrices,
      300,
      1,
      0
    );

    const selectStmt = db.prepare(`SELECT * FROM child_markets WHERE id = ?`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childMarket = selectStmt.get(childMarketId) as any;

    assert.ok(childMarket, 'Inserted child market should be retrieved');
    assert.equal(childMarket.parent_market_id, parentMarketId);
    assert.equal(childMarket.question, question);
    assert.equal(childMarket.outcomes, outcomes);
    assert.equal(childMarket.outcome_prices, outcomePrices);
    assert.equal(childMarket.volume, 300);
    assert.equal(childMarket.active, 1);
    assert.equal(childMarket.closed, 0);

    // Optionally, parse JSON fields
    const parsedOutcomes = JSON.parse(childMarket.outcomes);
    const parsedOutcomePrices = JSON.parse(childMarket.outcome_prices);
    assert.deepEqual(parsedOutcomes, ['Yes', 'No']);
    assert.deepEqual(parsedOutcomePrices, [1.5, 2.5]);
  });

  it('should insert and retrieve a report with a timestamp', () => {
    const dbManager = getDbManager();
    const db = dbManager.getConnection();

    const reportId = 'report1';
    const content = 'This is a test report.';

    const insertStmt = db.prepare(`
      INSERT INTO reports (id, content)
      VALUES (?, ?)
    `);
    insertStmt.run(reportId, content);

    const selectStmt = db.prepare(`SELECT * FROM reports WHERE id = ?`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = selectStmt.get(reportId) as any;

    assert.ok(report, 'Inserted report should be retrieved');
    assert.equal(report.id, reportId);
    assert.equal(report.content, content);
    assert.ok(report.created_at, 'Report should have a created_at timestamp');
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
      fs.rmSync(newDbPath);
    }
  });

  it('should handle schema initialization errors gracefully', () => {
    // Backup the original readFileSync and logger.error methods
    const originalReadFileSync = fs.readFileSync;

    // Mock readFileSync to throw an error
    fs.readFileSync = () => {
      throw new Error('Simulated readFile error');
    };

    try {
      // Attempt to create DatabaseManager, expecting it to throw
      assert.throws(
        () => new DatabaseManager('nonexistent.db'),
        {
          name: 'Error',
          message: 'Simulated readFile error',
        },
        'DatabaseManager constructor should throw the simulated readFile error'
      );
    } finally {
      // Restore the original readFileSync and logger.error methods
      fs.readFileSync = originalReadFileSync;
      // remove non-existent db file
      fs.rmSync('nonexistent.db', { force: true });
    }
  });
});
