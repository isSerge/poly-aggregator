import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';
import { DatabaseManager } from '../db/db.js';
import { InsertResult, prepareTyped, TypedStatement } from '../db/types.js';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';

// SQLite row types
export interface SqliteReport {
  id: string;
  content: string;
  created_at: string;
  [key: string]: string | number | boolean | null;
}

export class ReportRepository {
  private readonly db: Database;
  private readonly insertReport: TypedStatement<SqliteReport, InsertResult>;

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager.getConnection();

    this.insertReport = prepareTyped(
      this.db,
      `INSERT INTO reports (id, content, created_at)
       VALUES (@id, @content, datetime('now'))`,
      z.object({
        lastInsertRowid: z.number(),
        changes: z.number(),
      })
    );
  }

  save(content: string): void {
    try {
      const report: SqliteReport = {
        id: uuidv4(),
        content,
        created_at: new Date().toISOString(),
      };

      this.insertReport.run(report);
      logger.info('Report saved successfully');
    } catch (error) {
      logger.error('Failed to save report:', error);
      throw error;
    }
  }

  getLatest(): string | null {
    try {
      const rows = this.db
        .prepare(
          `
        SELECT content 
        FROM reports 
        ORDER BY created_at DESC 
        LIMIT 1
      `
        )
        .all() as Array<{ content: string }>;

      return rows[0]?.content ?? null;
    } catch (error) {
      logger.error('Failed to get latest report:', error);
      throw error;
    }
  }
}
