import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';
import { DatabaseType, DatabaseManager } from '../db/db.js';

export class ReportRepository {
  private readonly db: DatabaseType;

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager.getConnection();
  }

  save(reportContent: string) {
    const stmt = this.db.prepare(`
        INSERT INTO reports (id, content, created_at)
        VALUES (?, ?, datetime('now'))
      `);
    stmt.run(uuidv4(), reportContent);
    logger.info('Report saved');
  }

  getLatest() {
    const row = this.db
      .prepare('SELECT content FROM reports ORDER BY created_at DESC LIMIT 1')
      .get() as { content: string } | undefined;
    return row?.content ?? null;
  }
}
