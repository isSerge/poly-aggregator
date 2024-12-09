import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { handleError } from './utils.js';
import {
  StreamlinedParentMarket,
  StreamlinedParentMarketArraySchema,
} from './types.js';

// Define paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FOLDER = path.join(__dirname, '../data');
const CURRENT_FILE = path.join(DATA_FOLDER, 'current.json');
const HISTORICAL_FILE = path.join(DATA_FOLDER, 'historical.json');
const TEMP_SUFFIX = '.tmp';

// Utility function to ensure the folder exists
async function ensureFolderExists(folder: string): Promise<void> {
  if (!existsSync(folder)) {
    await fs.mkdir(folder, { recursive: true });
  }
}

// Write data to a JSON file (atomic)
async function writeJSON(
  filename: string,
  data: StreamlinedParentMarket[]
): Promise<void> {
  try {
    const tempFile = filename + TEMP_SUFFIX;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
    await fs.rename(tempFile, filename); // Replace the original file
    console.log(`Successfully wrote to ${filename}`);
  } catch (error) {
    handleError(error, `Error writing to ${filename}`);
    throw error;
  }
}

// Read data from a JSON file
async function readJSON<T>(filename: string): Promise<T[]> {
  try {
    const file = await fs.readFile(filename, 'utf-8');
    const data = JSON.parse(file);

    // Validate against StreamlinedParentMarketSchema
    if (!StreamlinedParentMarketArraySchema.safeParse(data).success) {
      throw new Error(`Invalid data structure found in ${filename}`);
    }

    return data as T[]; // Cast to T[]
  } catch (error) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      console.warn(`File ${filename} not found, returning empty array.`);
      return [];
    }
    handleError(error, `Error reading from ${filename}`);
    throw error;
  }
}

// Helper function to merge data (by `id`)
function mergeData(
  existingData: StreamlinedParentMarket[],
  newData: StreamlinedParentMarket[]
): StreamlinedParentMarket[] {
  const existingMap = new Map(existingData.map((item) => [item.id, item]));
  newData.forEach((item) => existingMap.set(item.id, item)); // Overwrite or add new data
  return Array.from(existingMap.values());
}

// Exported methods
export async function saveCurrentData(
  data: StreamlinedParentMarket[]
): Promise<void> {
  await ensureFolderExists(DATA_FOLDER);

  // Validate data before saving
  const validationResult = StreamlinedParentMarketArraySchema.safeParse(data);

  if (!validationResult.success) {
    console.error(
      `Data validation failed for current data:`,
      validationResult.error
    );
    throw new Error(`Invalid data structure for current data`);
  }

  await writeJSON(CURRENT_FILE, data);
}

export async function saveHistoricalData(
  data: StreamlinedParentMarket[]
): Promise<void> {
  await ensureFolderExists(DATA_FOLDER);

  // Validate the new data before merging it with historical data
  const validationResult = StreamlinedParentMarketArraySchema.safeParse(data);
  if (!validationResult.success) {
    console.error(
      `Data validation failed for historical data:`,
      validationResult.error
    );
    throw new Error(`Invalid data structure for historical data`);
  }

  // Fetch existing historical data
  const existingData = await getHistoricalData();

  // Merge and deduplicate data
  const mergedData = mergeData(existingData, data).filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id) // Deduplicate by ID
  );

  // Write the updated historical data back to the file
  await writeJSON(HISTORICAL_FILE, mergedData);
}

export async function getHistoricalData(): Promise<StreamlinedParentMarket[]> {
  await ensureFolderExists(DATA_FOLDER);
  return await readJSON(HISTORICAL_FILE);
}
