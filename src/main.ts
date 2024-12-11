import { logger } from './logger.js';
import { fetchCryptoMarkets } from './markets.js';
import {
  saveCurrentMarkets,
  getHistoricalData,
  getLatestReport,
  saveReport,
} from './storage.js';
import { analyzeTrendsWithLLM } from './llm.js';
import { handleError } from './utils.js';

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

    // Step 2: Save the current markets to the database
    saveCurrentMarkets(currentMarkets);
    logger.info('Saved current market data.');

    // Step 3: Load historical data and the latest LLM report
    const historicalMarkets = await getHistoricalData();
    const latestReport = await getLatestReport();

    const hasHistoricalData = historicalMarkets.length > 0;

    // If there is no historical data, skip the analysis
    if (hasHistoricalData) {
      // Step 4: Feed data to LLM for analysis
      const analysis = await analyzeTrendsWithLLM(
        currentMarkets,
        historicalMarkets,
        latestReport
      );

      if (!analysis || !analysis.content) {
        logger.warn('Analysis could not be completed. Skipping report save.');
        return;
      }

      logger.info('Analysis completed:');
      logger.info(analysis.content);

      // Step 5: Save the LLM report to the database
      saveReport(analysis.content.toString());
      logger.info('Saved LLM report.');
    }
  } catch (error) {
    handleError(
      error,
      'An error occurred while running the application. Exiting...'
    );
    process.exit(1);
  }
}
