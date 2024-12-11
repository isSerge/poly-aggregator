import cron from 'node-cron';
import { logger } from './logger.js';
import { fetchCryptoMarkets } from './markets.js';
import {
  saveHistoricalData,
  getHistoricalData,
  getLatestReport,
  saveReport,
} from './storage.js';
import { analyzeTrendsWithLLM } from './llm.js';

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

    // Step 2: Load historical data
    const historicalMarkets = await getHistoricalData();

    // Step 3: Get previous LLM report
    const latestReport = await getLatestReport();

    const hasHistoricalData = historicalMarkets && historicalMarkets.length > 0;

    // If there is no historical data, skip the analysis
    if (hasHistoricalData) {
      // Step 4: Feed data to LLM for analysis
      const analysis = await analyzeTrendsWithLLM(
        currentMarkets,
        historicalMarkets,
        latestReport
      );

      logger.info('Analysis completed:');
      logger.info(analysis.content);
      // Step 5: Save the LLM report
      await saveReport(analysis.content.toString());
    }

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

// Schedule the main function to run every 6 hours
cron.schedule('0 */12 * * *', main);

// Initial call to run the main function immediately
main();
