import { DatabaseManager } from './db/db.js';
import { logger } from './logger.js';
import { MarketRepository } from './markets/markets.js';
import { ReportRepository } from './reports/reports.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { analyzePredictionMarkets } from './reports/llm.js';
import { handleError } from './utils.js';

/**
 * Test script to analyze market trends using LLM without saving results.
 * Useful for testing prompt changes and validating LLM output.
 */
const dbManager = await DatabaseManager.create();

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

  const analysis = await analyzePredictionMarkets(
    currentMarkets,
    historicalMarkets,
    latestReport
  );

  if (analysis?.content) {
    logger.info('Analysis:', analysis.content);
  }
} catch (error) {
  handleError(error, 'Analysis test failed');
  process.exit(1);
} finally {
  dbManager.close();
}
