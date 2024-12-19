import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';
import { config } from '../config.js';
import { DatabaseError } from '../errors.js';

export class DatabaseManager {
  private readonly db: DatabaseType;
  private readonly dbPath: string;
  private readonly dbDir: string;

  constructor(dbPath: string = config.DB_PATH) {
    this.dbPath = dbPath;
    this.dbDir = path.dirname(dbPath);

    this.ensureDirectoryExists();
    this.db = this.createDatabaseConnection();
    this.enableForeignKeys();
    this.initializeSchema();

    logger.info('Database initialized successfully');
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
      logger.info(`Created directory: ${this.dbDir}`);
    }
  }

  private createDatabaseConnection(): DatabaseType {
    try {
      return new Database(this.dbPath, {
        verbose:
          process.env.NODE_ENV === 'development' ? console.log : undefined,
      });
    } catch (error) {
      throw DatabaseError.from(
        error,
        `Failed to connect to database at ${this.dbPath}`
      );
    }
  }

  private enableForeignKeys(): void {
    this.db.pragma('foreign_keys = ON');
  }

  private initializeSchema(): void {
    const schemaPath = this.resolveSchemaPath();
    let schema: string;

    try {
      schema = fs.readFileSync(schemaPath, 'utf-8');
    } catch (error) {
      throw DatabaseError.from(
        error,
        `Failed to read schema file at ${schemaPath}`
      );
    }

    try {
      this.db.exec(schema);
    } catch (error) {
      throw DatabaseError.from(error, 'Failed to initialize database schema');
    }
  }

  private resolveSchemaPath(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, 'schema.sql');
  }

  public getConnection(): DatabaseType {
    return this.db;
  }

  public isHealthy(): boolean {
    return this.db.open;
  }

  public close(): void {
    if (this.db.open) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }

  public areForeignKeysEnabled(): boolean {
    const result = this.db.pragma('foreign_keys', { simple: true });
    return result === 1;
  }
}
