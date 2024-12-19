import { logger } from './logger.js';
import { handleError } from './utils.js';
import { DatabaseManager } from './db/db.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { MarketRepository } from './markets/markets.js';
import { analyzePredictionMarkets } from './reports/llm.js';
import { ReportRepository } from './reports/reports.js';
import { formatPrompt } from './reports/prompt.js';

export async function main() {
  const dbManager = new DatabaseManager();

  try {
    if (!dbManager.isHealthy()) {
      logger.warn('Database connection failed. Exiting.');
      return;
    }

    const marketRepository = new MarketRepository(dbManager);
    const reportRepository = new ReportRepository(dbManager);

    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets?.length) {
      logger.warn('No market data fetched. Exiting.');
      return;
    }

    const previousMarketsData = await marketRepository.getActiveMarkets();

    console.log('previousMarketsData', previousMarketsData);

    marketRepository.saveMarkets(currentMarkets);

    if (!previousMarketsData.length) {
      logger.info(
        'No previous markets found. Exiting after saving current markets.'
      );
      return;
    }

    logger.info(
      `Fetched market data: current markets: ${currentMarkets.length}, previous markets: ${previousMarketsData.length}`
    );

    const latestReport = await reportRepository.getLatest();

    const prompt = formatPrompt(
      currentMarkets,
      previousMarketsData,
      latestReport
    );

    const analysis = await analyzePredictionMarkets(prompt);

    if (analysis?.content) {
      reportRepository.save(analysis.content.toString());
      logger.info(analysis.content, 'Analysis completed:');
    }
  } catch (error) {
    handleError(error, 'Application error');
  } finally {
    dbManager.close();
  }
}
