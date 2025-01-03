import { logger } from './logger.js';
import { fetchCryptoMarkets } from './polymarket/polymarket.js';
import { formatPrompt } from './reports/prompt.js';
import { DatabaseError, ValidationError, NetworkError } from './errors.js';
import { analyzePredictionMarkets } from './reports/llm.js';
import fsp from 'fs/promises';
import { createDependencies } from './index.js';
import { fetchCryptoPrices } from './coinmarketcap/coinmarketcap.js';

/**
 * Test script to generate prompt without feeding it to LLM and saving results.
 */
async function testPrompt() {
  const { dbManager, marketRepository, reportRepository, marketFilter } =
    createDependencies();

  try {
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

    const symbols = ['BTC', 'ETH', 'SOL'];
    const prices = await fetchCryptoPrices(symbols);

    const prompt = formatPrompt(
      filteredCurrentMarkets,
      filteredPreviousMarkets,
      prices,
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
