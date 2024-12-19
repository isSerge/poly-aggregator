import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { Database } from 'better-sqlite3';
import { logger } from '../logger.js';
import { DatabaseManager } from '../db/db.js';
import { InsertResult, prepareTyped, TypedStatement } from '../db/types.js';
import { DatabaseError, ValidationError } from '../errors.js';

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
    if (!content.trim()) {
      throw new ValidationError('Report content cannot be empty', []);
    }

    try {
      const report: SqliteReport = {
        id: uuidv4(),
        content,
        created_at: new Date().toISOString(),
      };

      this.insertReport.run(report);
      logger.info('Report saved successfully');
    } catch (error) {
      const dbError = DatabaseError.from(error, 'Failed to save report');
      logger.error(dbError, 'Failed to save report:');
      throw dbError;
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
      const dbError = DatabaseError.from(error, 'Failed to get latest report');
      logger.error(dbError, 'Failed to get latest report:');
      throw dbError;
    }
  }
}
