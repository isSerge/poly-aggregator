import { DatabaseManager } from './db/db.js';
import { logger } from './logger.js';
import { MarketRepository } from './markets/markets.js';
import { ReportRepository } from './reports/reports.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { handleError } from './utils.js';
import { formatPrompt } from './reports/prompt.js';

/**
 * Test script to generate prompt without feeding it to LLM and saving results.
 */
const dbManager = new DatabaseManager();

try {
  if (!dbManager.isHealthy()) {
    logger.warn('Database connection failed');
    process.exit(1);
  }

  const marketRepository = new MarketRepository(dbManager);
  const reportRepository = new ReportRepository(dbManager);

  const currentMarkets = await fetchCryptoMarkets();
  const historicalMarkets = await marketRepository.getHistoricalData();
  const latestReport = await reportRepository.getLatest();

  if (!currentMarkets?.length || !historicalMarkets?.length) {
    logger.warn('Insufficient market data');
    process.exit(1);
  }

  logger.info(
    `Fetched: current markets: ${currentMarkets.length}, historical: ${historicalMarkets.length}`
  );

  const prompt = formatPrompt(currentMarkets, historicalMarkets, latestReport);

  logger.info('Prompt: ');
  logger.info(prompt);
} catch (error) {
  handleError(error, 'Analysis test failed');
  process.exit(1);
} finally {
  dbManager.close();
}