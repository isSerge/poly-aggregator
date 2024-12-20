import { logger } from './logger.js';
import { DatabaseError, ValidationError, NetworkError } from './errors.js';
import { DatabaseManager } from './db/db.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { MarketRepository } from './markets/markets.js';
import { MarketFilter } from './markets/market-filter.js';
import { analyzePredictionMarkets } from './reports/llm.js';
import { ReportRepository } from './reports/reports.js';
import { formatPrompt } from './reports/prompt.js';

export async function main() {
  const dbManager = new DatabaseManager();
  const marketFilter = new MarketFilter();

  try {
    if (!dbManager.isHealthy()) {
      throw new DatabaseError('Database connection is not healthy');
    }

    const marketRepository = new MarketRepository(dbManager);
    const reportRepository = new ReportRepository(dbManager);

    // 1. Fetch current market data
    const currentMarkets = await fetchCryptoMarkets();
    if (!currentMarkets?.length) {
      logger.warn('No market data fetched. Exiting.');
      return;
    }

    // 2. Get previous markets BEFORE saving current ones
    const previousMarkets = await marketRepository.getActiveMarkets();

    if (!previousMarkets?.length) {
      logger.warn('No previous market data available');
    }

    logger.info(
      `Market data fetched: current markets: ${currentMarkets.length}, previous markets: ${previousMarkets.length}`
    );

    // 3. Filter both sets for LLM analysis
    const { markets: filteredCurrentMarkets, stats: currentStats } =
      marketFilter.filterMarkets(currentMarkets, {
        timeWeight: true,
        targetCount: 15,
        minScore: 0.1,
      });

    const { markets: filteredPreviousMarkets, stats: previousStats } =
      marketFilter.filterMarkets(previousMarkets, {
        timeWeight: true,
        targetCount: 15,
        minScore: 0.1,
      });

    // Log filtering statistics
    logger.info(
      {
        current: {
          total: currentMarkets.length,
          filtered: filteredCurrentMarkets.length,
          meanVolume: currentStats.meanVolume,
          meanLiquidity: currentStats.meanLiquidity,
        },
        previous: {
          total: previousMarkets.length,
          filtered: filteredPreviousMarkets.length,
          meanVolume: previousStats.meanVolume,
          meanLiquidity: previousStats.meanLiquidity,
        },
      },
      'Market filtering results:'
    );

    // 4. Generate and save analysis
    const latestReport = await reportRepository.getLatest();
    const prompt = formatPrompt(
      filteredCurrentMarkets,
      filteredPreviousMarkets,
      latestReport
    );

    const analysis = await analyzePredictionMarkets(prompt);
    if (analysis?.content) {
      await reportRepository.save(analysis.content.toString());
      logger.info(analysis.content, 'Analysis completed and saved');
    }

    // 5. Save current markets AFTER analysis is done
    await marketRepository.saveMarkets(currentMarkets);
    logger.info(`Saved ${currentMarkets.length} markets to database`);
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
