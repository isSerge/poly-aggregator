import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { ReportRepository } from '../reports/reports.js';
import { DatabaseManager } from '../db/db.js';
import { setupTest } from './utils/test-utils.js';
import { v4 as uuidv4 } from 'uuid';

describe('ReportRepository', () => {
  const { getDbManager } = setupTest();
  let dbManager: DatabaseManager;
  let reportRepo: ReportRepository;

  beforeEach(() => {
    dbManager = getDbManager();
    reportRepo = new ReportRepository(dbManager);
  });

  afterEach(() => {
    dbManager.close();
  });

  it('should save a report successfully', () => {
    const reportContent = 'This is a test report.';

    // Save the report
    reportRepo.save(reportContent);

    // Retrieve the latest report directly from the database
    const db = dbManager.getConnection();
    const row = db
      .prepare('SELECT * FROM reports WHERE content = ?')
      .get(reportContent) as
      | { id: string; content: string; created_at: string }
      | undefined;

    // Assertions
    assert.ok(row, 'Report should be saved in the database');
    assert.equal(
      row?.content,
      reportContent,
      'Saved report content should match the input'
    );
    assert.ok(row?.id, 'Report should have a valid UUID as id');
    assert.ok(row?.created_at, 'Report should have a created_at timestamp');
  });

  it('should retrieve the latest report without using sleep', () => {
    const db = dbManager.getConnection();

    // Directly insert reports with specific created_at timestamps
    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), 'First report content.', '2023-01-01 10:00:00');

    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), 'Second report content.', '2023-01-01 10:00:01');

    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), 'Third report content.', '2023-01-01 10:00:02');

    // Retrieve the latest report
    const latest = reportRepo.getLatest();

    // Assertions
    assert.equal(
      latest,
      'Third report content.',
      'getLatest should return the most recently saved report'
    );
  });

  it('should return null when retrieving latest report with no reports saved', () => {
    // Ensure no reports are in the database
    const db = dbManager.getConnection();
    db.prepare('DELETE FROM reports').run();

    // Attempt to retrieve the latest report
    const latest = reportRepo.getLatest();

    // Assertions
    assert.equal(
      latest,
      null,
      'getLatest should return null when no reports are saved'
    );
  });

  it('should handle saving multiple reports with identical content', () => {
    const db = dbManager.getConnection();
    const reportContent = 'Identical report content.';

    // Insert multiple reports with identical content but distinct created_at timestamps
    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), reportContent, '2023-01-01 10:00:00');

    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), reportContent, '2023-01-01 10:00:01');

    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), reportContent, '2023-01-01 10:00:02');

    // Retrieve all reports with the identical content
    const rows = db
      .prepare('SELECT * FROM reports WHERE content = ?')
      .all(reportContent) as Array<{
      id: string;
      content: string;
      created_at: string;
    }>;

    // Assertions
    assert.equal(
      rows.length,
      3,
      'All identical reports should be saved in the database'
    );

    // Verify ordering by created_at
    assert.ok(
      new Date(rows[0].created_at) < new Date(rows[1].created_at) &&
        new Date(rows[1].created_at) < new Date(rows[2].created_at),
      'Reports should be ordered by created_at in ascending order'
    );
  });

  it('should always return the most recently saved report based on created_at', () => {
    const db = dbManager.getConnection();
    const report1 = 'Report one.';
    const report2 = 'Report two.';

    // Insert the first report with an earlier timestamp
    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), report1, '2023-01-01 10:00:00');

    // Insert the second report with a later timestamp
    db.prepare(
      `
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, ?)
    `
    ).run(uuidv4(), report2, '2023-01-01 10:00:01');

    // Retrieve the latest report
    const latest = reportRepo.getLatest();

    // Assertions
    assert.equal(
      latest,
      report2,
      'getLatest should return the report with the latest created_at timestamp'
    );
  });
});
