import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path, { dirname } from 'path';
import { logger } from '../logger.js';
import { handleError } from '../utils.js';
import { config } from '../config.js';
import { fileURLToPath } from 'url';

const DB_DIR = path.dirname(config.DB_PATH);

// Ensure the directory exists
if (!existsSync(DB_DIR)) {
  await fs.mkdir(DB_DIR, { recursive: true });
  logger.info(`Created directory: ${DB_DIR}`);
}

export const db: DatabaseType = new Database(config.DB_PATH, {
  verbose: console.log,
});

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeSchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    db.exec(schema);
    logger.info('Database schema initialized');
  } catch (error) {
    handleError(error, 'Error initializing database schema');
  }
}

initializeSchema();
