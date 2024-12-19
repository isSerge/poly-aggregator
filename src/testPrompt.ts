import { DatabaseManager } from './db/db.js';
import { logger } from './logger.js';
import { MarketRepository } from './markets/markets.js';
import { ReportRepository } from './reports/reports.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { formatPrompt } from './reports/prompt.js';
import { DatabaseError, ValidationError, NetworkError } from './errors.js';

/**
 * Test script to generate prompt without feeding it to LLM and saving results.
 */
async function testPrompt() {
  const dbManager = new DatabaseManager();

  try {
    if (!dbManager.isHealthy()) {
      throw new DatabaseError('Database connection is not healthy');
    }

    const marketRepository = new MarketRepository(dbManager);
    const reportRepository = new ReportRepository(dbManager);

    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets?.length) {
      throw new ValidationError('No market data was fetched', []);
    }

    const previousMarkets = await marketRepository.getActiveMarkets();
    if (!previousMarkets?.length) {
      throw new ValidationError('No previous markets found for comparison', []);
    }

    const latestReport = await reportRepository.getLatest();

    logger.info(
      `Fetched: current markets: ${currentMarkets.length}, previous: ${previousMarkets.length}`
    );

    const prompt = formatPrompt(currentMarkets, previousMarkets, latestReport);
    logger.info('Generated prompt:');
    logger.info(prompt);
  } catch (error) {
    let logMessage = 'Test failed';

    if (error instanceof DatabaseError) {
      logMessage = `Database error: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
    } else if (error instanceof NetworkError) {
      logMessage = `Network error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`;
    } else if (error instanceof ValidationError) {
      logMessage = `Validation error: ${error.message}`;
    }

    logger.error(logMessage, error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

testPrompt().catch(() => process.exit(1));
