import { logger } from './logger.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { MarketRepository } from './markets/markets.js';
import { analyzeTrendsWithLLM } from './llm/llm.js';
import { handleError } from './utils.js';
import { DatabaseManager } from './db/db.js';

export async function main() {
  const dbManager = new DatabaseManager();

  try {
    if (!dbManager.isHealthy()) {
      logger.warn('Database connection failed. Exiting.');
      return;
    }

    const marketRepository = new MarketRepository(dbManager);

    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets?.length) {
      logger.warn('No market data fetched. Exiting.');
      return;
    }

    const historicalMarkets = await marketRepository.getHistoricalData();
    if (!historicalMarkets.length) return;

    logger.info(
      `Fetched market data: ${currentMarkets.length}, ${historicalMarkets.length}`
    );

    const latestReport = await marketRepository.getLatestReport();

    const analysis = await analyzeTrendsWithLLM(
      currentMarkets,
      historicalMarkets,
      latestReport
    );

    if (analysis?.content) {
      marketRepository.saveReport(analysis.content.toString());
      marketRepository.saveCurrentMarkets(currentMarkets);
      logger.info(analysis.content, 'Analysis completed:');
    }
  } catch (error) {
    handleError(error, 'Application error');
  } finally {
    dbManager.close();
  }
}
