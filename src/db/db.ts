import Database from 'better-sqlite3';
import { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { logger } from '../logger.js';
import { handleError } from '../utils.js';
import { config } from '../config.js';
import { fileURLToPath } from 'url';

class DatabaseManager {
  private readonly db: DatabaseType;
  private readonly dbPath: string;
  private readonly dbDir: string;

  constructor(dbPath: string = config.DB_PATH) {
    this.dbPath = dbPath;
    this.dbDir = path.dirname(dbPath);
    this.ensureDirectoryExists();
    this.db = this.createDatabaseConnection();
    this.initializeSchema();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
      logger.info(`Created directory: ${this.dbDir}`);
    }
  }

  private createDatabaseConnection(): DatabaseType {
    return new Database(this.dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });
  }

  private async initializeSchema() {
    try {
      const schemaPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'schema.sql'
      );
      const schema = await fsp.readFile(schemaPath, 'utf-8');
      this.db.exec(schema);
      logger.info('Database schema initialized');
    } catch (error) {
      handleError(error, 'Error initializing database schema');
    }
  }

  getConnection(): DatabaseType {
    return this.db;
  }
}

export const databaseManager = new DatabaseManager();
export const db: DatabaseType = databaseManager.getConnection();
