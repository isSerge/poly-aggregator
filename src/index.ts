import { logger } from './logger.js';
import { fetchCryptoMarkets } from './markets.js';
import { saveCurrentData, getCurrentData, saveHistoricalData, getHistoricalData } from './storage.js';
// import { analyzeWithLLM } from './llm.js'; // Import the LLM interaction module

export async function main() {
  try {
    logger.info('Starting the application...');

    // Step 1: Fetch the latest market data
    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets || currentMarkets.length === 0) {
      logger.warn('No market data fetched. Exiting the application.');
      return;
    }

    logger.info(`Fetched ${currentMarkets.length} crypto markets.`);

    // Step 2: Save the current market data to current.json
    await saveCurrentData(currentMarkets);
    logger.info('Saved current market data.');

    // Step 3: Load historical data
    const historicalMarkets = await getHistoricalData();

    // Step 4: Feed data to LLM for analysis

    logger.info('LLM Analysis Result:')
    // Step 5: Update historical data after feeding it to LLM
    const updatedHistoricalData = [...historicalMarkets, ...currentMarkets];
    await saveHistoricalData(updatedHistoricalData);
    logger.info('Updated historical market data.');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`An error occurred during execution: ${error.message}`);
    } else {
      logger.error(`An error occurred during execution: ${String(error)}`);
    }
    process.exit(1);
  }
}

main();