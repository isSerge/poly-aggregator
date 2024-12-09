import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';

// Define paths
const DATA_FOLDER = path.join(path.dirname(import.meta.url), '../data');
const CURRENT_FILE = path.join(DATA_FOLDER, 'current.json');
const HISTORICAL_FILE = path.join(DATA_FOLDER, 'historical.json');
const TEMP_SUFFIX = '.tmp';

// Utility function to ensure the folder exists
async function ensureFolderExists(folder: string): Promise<void> {
    if (!existsSync(folder)) {
        await fs.mkdir(folder, { recursive: true });
    }
}

// Validate data using Zod (optional but recommended for safety)
const MarketDataSchema = z.array(
    z.object({
        id: z.string(),                        // Unique identifier
        title: z.string(),                     // Market title/question
        description: z.string().optional(),    // (Optional) Context of the market
        startDate: z.string().optional(),      // (Optional) ISO string
        endDate: z.string().optional(),        // (Optional) ISO string
        active: z.boolean(),                   // Active status
        closed: z.boolean(),                   // Closed status
        liquidity: z.number(),                 // Total liquidity
        volume: z.number(),                    // Total volume
        childMarkets: z.array(
            z.object({
                id: z.string(),                        // Unique identifier
                question: z.string(),                  // Market-specific question
                outcomes: z.array(z.string()),        // Parsed outcomes array
                outcomePrices: z.array(z.string()),   // Parsed outcome prices
                volume: z.number(),                    // Volume in numeric format
                active: z.boolean().optional(),        // Active status (optional)
                closed: z.boolean().optional(),        // Closed status (optional)
            })
        ).optional(),                             // Child markets are optional
    })
);

// Write data to a JSON file (atomic)
async function writeJSON(filename: string, data: any): Promise<void> {
    try {
        const tempFile = filename + TEMP_SUFFIX;
        await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
        await fs.rename(tempFile, filename); // Replace the original file
        console.log(`Successfully wrote to ${filename}`);
    } catch (error) {
         // Handle both Error and non-Error exceptions
         if (error instanceof Error) {
            console.error(`Error writing to ${filename}:`, error.message);
        } else {
            console.error(`Error writing to ${filename}:`, String(error));
        }
        throw error;
    }
}

// Read data from a JSON file
async function readJSON<T>(filename: string): Promise<T[]> {
    try {
        const file = await fs.readFile(filename, 'utf-8');
        const data = JSON.parse(file);

        // Optional: Validate the data
        if (MarketDataSchema.safeParse(data).success) {
            return data;
        } else {
            console.warn(`Invalid data structure in ${filename}. Returning an empty array.`);
            return [];
        }
    } catch (error) {
        if (error instanceof Error && (error as any).code === 'ENOENT') {
            console.warn(`File ${filename} not found, returning empty array.`);
            return [];
        }
        throw error;
    }
}

// Append new data to an existing JSON file
async function appendToJSON(filename: string, newData: any[]): Promise<void> {
    const existingData = await readJSON<any[]>(filename);
    const mergedData = mergeData(existingData, newData);
    await writeJSON(filename, mergedData);
}

// Helper function to merge data (by `id`)
function mergeData(existingData: any[], newData: any[]): any[] {
    const existingMap = new Map(existingData.map(item => [item.id, item]));
    newData.forEach(item => {
        existingMap.set(item.id, item); // Overwrite or add new data
    });
    return Array.from(existingMap.values());
}

// Exported methods
export async function saveCurrentData(data: any[]): Promise<void> {
    await ensureFolderExists(DATA_FOLDER);

    // console.log(data[0].childMarkets);
    
    // Validate data before saving
    const validationResult = MarketDataSchema.safeParse(data);

    if (!validationResult.success) {
        console.error(`Data validation failed for current data:`, validationResult.error);
        throw new Error(`Invalid data structure for current data`);
    }

    await writeJSON(CURRENT_FILE, data);
}

export async function getCurrentData(): Promise<any[]> {
    await ensureFolderExists(DATA_FOLDER);
    return await readJSON(CURRENT_FILE);
}

export async function saveHistoricalData(data: any[]): Promise<void> {
    await ensureFolderExists(DATA_FOLDER);
    
    // Validate data before saving
    const validationResult = MarketDataSchema.safeParse(data);
    if (!validationResult.success) {
        console.error(`Data validation failed for historical data:`, validationResult.error);
        throw new Error(`Invalid data structure for historical data`);
    }

    await appendToJSON(HISTORICAL_FILE, data);
}

export async function getHistoricalData(): Promise<any[]> {
    await ensureFolderExists(DATA_FOLDER);
    return await readJSON(HISTORICAL_FILE);
}
