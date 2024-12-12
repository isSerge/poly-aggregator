import { logger } from './logger.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import {
  saveCurrentMarkets,
  getHistoricalData,
  getLatestReport,
  saveReport,
} from './markets/markets.js';
import { analyzeTrendsWithLLM } from './llm/llm.js';
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

    // Step 2: Load historical data and the latest LLM report
    const historicalMarkets = await getHistoricalData();
    const latestReport = await getLatestReport();

    const hasHistoricalData = historicalMarkets.length > 0;

    // If there is no historical data, skip the analysis
    if (hasHistoricalData) {
      // Step 3: Feed data to LLM for analysis
      const analysis = await analyzeTrendsWithLLM(
        currentMarkets,
        historicalMarkets,
        latestReport
      );

      // Step 4: Save the analysis and the current markets to the database
      if (analysis && analysis.content) {
        saveReport(analysis.content.toString());
        logger.info('Report saved to the database.');
        saveCurrentMarkets(currentMarkets);
        logger.info('Current markets saved to the database.');
      }

      logger.info('Analysis completed:');
      logger.info(analysis.content);
    }
  } catch (error) {
    handleError(
      error,
      'An error occurred while running the application. Exiting...'
    );
    process.exit(1);
  }
}
