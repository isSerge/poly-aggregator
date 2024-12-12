import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger.js';
import { handleError } from '../utils.js';
import { config } from '../config.js';
import { fileURLToPath } from 'url';

export class DatabaseManager {
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

  public close() {
    this.db.close();
    logger.info('Database connection closed');
  }

  public isHealthy(): boolean {
    return this.db.open;
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

  private initializeSchema() {
    try {
      const schemaPath = this.resolveSchemaPath();
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
      logger.info('Database schema initialized');
    } catch (error) {
      handleError(error, 'Error initializing database schema');
      throw error; // Re-throw to indicate failure
    }
  }

  private resolveSchemaPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, 'schema.sql');
  }

  getConnection(): DatabaseType {
    return this.db;
  }
}

export { DatabaseType };
