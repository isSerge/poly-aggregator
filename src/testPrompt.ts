import { DatabaseManager } from './db/db.js';
import { logger } from './logger.js';
import { MarketRepository } from './markets/markets.js';
import { ReportRepository } from './reports/reports.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { formatPrompt } from './reports/prompt.js';
import { DatabaseError, ValidationError, NetworkError } from './errors.js';
import { MarketFilter } from './markets/market-filter.js';
import { analyzePredictionMarkets } from './reports/llm.js';
import fsp from 'fs/promises';

/**
 * Test script to generate prompt without feeding it to LLM and saving results.
 */
async function testPrompt() {
  const dbManager = new DatabaseManager();
  const marketFilter = new MarketFilter();

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

    const previousMarkets = await marketRepository.getActiveMarkets();
    if (!previousMarkets?.length) {
      logger.warn('No previous market data available');
    }

    logger.info(
      `Market data fetched: current markets: ${currentMarkets.length}, previous markets: ${previousMarkets.length}`
    );

    const filteredCurrentMarkets = marketFilter.filterMarkets(currentMarkets, {
      timeWeight: true,
      minScore: 0.05,
      categoryNormalization: true,
    });

    await fsp.writeFile(
      'artifacts/currentMarkets.json',
      JSON.stringify(currentMarkets, null, 2)
    );
    await fsp.writeFile(
      'artifacts/filteredCurrentMarkets.json',
      JSON.stringify(filteredCurrentMarkets, null, 2)
    );

    const filteredPreviousMarkets = marketFilter.filterMarkets(
      previousMarkets,
      {
        timeWeight: true,
        targetCount: 15,
        minScore: 0.1,
      }
    );

    await fsp.writeFile(
      'artifacts/previousMarkets.json',
      JSON.stringify(previousMarkets, null, 2)
    );
    await fsp.writeFile(
      'artifacts/filteredPreviousMarkets.json',
      JSON.stringify(filteredPreviousMarkets, null, 2)
    );
    // Log filtering statistics
    logger.info(
      {
        current: {
          total: currentMarkets.length,
          filtered: filteredCurrentMarkets.markets.length,
          meanVolume: filteredCurrentMarkets.stats.meanVolume,
          meanLiquidity: filteredCurrentMarkets.stats.meanLiquidity,
        },
        previous: {
          total: previousMarkets.length,
          filtered: filteredPreviousMarkets.markets.length,
          meanVolume: filteredPreviousMarkets.stats.meanVolume,
          meanLiquidity: filteredPreviousMarkets.stats.meanLiquidity,
        },
      },
      'Market filtering results:'
    );

    const latestReport = await reportRepository.getLatest();
    const prompt = formatPrompt(
      filteredCurrentMarkets,
      filteredPreviousMarkets,
      latestReport
    );
    logger.info(prompt, 'Generated prompt:');

    await fsp.writeFile('artifacts/prompt.txt', prompt);

    const analysis = await analyzePredictionMarkets(prompt);

    if (analysis?.content) {
      logger.info(analysis.content, 'Analysis completed and saved');
      await fsp.writeFile(
        'artifacts/analysis.txt',
        analysis.content.toString()
      );
    }
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
