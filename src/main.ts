import { logger } from './logger.js';
import { DatabaseError, ValidationError, NetworkError } from './errors.js';
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
      throw new DatabaseError('Database connection is not healthy');
    }

    const marketRepository = new MarketRepository(dbManager);
    const reportRepository = new ReportRepository(dbManager);

    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets?.length) {
      logger.warn('No market data fetched. Exiting.');
      return;
    }

    const previousMarketsData = await marketRepository.getActiveMarkets();

    await marketRepository.saveMarkets(currentMarkets);

    if (!previousMarketsData.length) {
      logger.info(
        'No previous markets found. Exiting after saving current markets.'
      );
      return;
    }

    logger.info(
      `Market data processed: current markets: ${currentMarkets.length}, previous markets: ${previousMarketsData.length}`
    );

    const latestReport = await reportRepository.getLatest();
    const prompt = formatPrompt(
      currentMarkets,
      previousMarketsData,
      latestReport
    );

    const analysis = await analyzePredictionMarkets(prompt);
    if (analysis?.content) {
      await reportRepository.save(analysis.content.toString());
      logger.info(analysis.content, 'Analysis completed and saved');
    }
  } catch (error) {
    let logMessage = 'Application error';

    if (error instanceof DatabaseError) {
      logMessage = `Database error: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
    } else if (error instanceof NetworkError) {
      logMessage = `Network error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`;
    } else if (error instanceof ValidationError) {
      logMessage = `Validation error: ${error.message}`;
    }

    logger.error(error, logMessage);
    throw error;
  } finally {
    dbManager.close();
  }
}
