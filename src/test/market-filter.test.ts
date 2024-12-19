import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { MarketFilter } from '../markets/market-filter.js';
import { ParentMarket } from '../markets/markets-schemas.js';

describe('MarketFilter', () => {
  let marketFilter: MarketFilter;

  beforeEach(() => {
    marketFilter = new MarketFilter();
  });

  const createMarket = (
    id: string,
    volume: number,
    liquidity: number,
    daysOld: number = 0
  ): ParentMarket => ({
    id,
    title: `Market ${id}`,
    startDate: new Date(
      Date.now() - daysOld * 24 * 60 * 60 * 1000
    ).toISOString(),
    endDate: new Date().toISOString(),
    liquidity,
    volume,
    childMarkets: [],
  });

  describe('Basic Filtering', () => {
    it('should handle empty market array', () => {
      const result = marketFilter.filterMarkets([]);
      assert.deepEqual(result.markets, []);
      assert.equal(result.stats.totalMarkets, 0);
      assert.equal(result.stats.meanVolume, 0);
      assert.equal(result.stats.meanLiquidity, 0);
    });

    it('should respect targetCount option', () => {
      const markets = Array(10)
        .fill(null)
        .map((_, i) => createMarket(`market${i}`, 1000, 1000));

      const result = marketFilter.filterMarkets(markets, { targetCount: 5 });
      assert.equal(result.markets.length, 5);
    });
  });

  describe('Market Statistics', () => {
    it('should calculate basic market statistics', () => {
      const markets = [
        createMarket('market1', 1000, 1000),
        createMarket('market2', 3000, 3000),
      ];

      const result = marketFilter.filterMarkets(markets);

      // Mean should be (1000 + 3000) / 2 = 2000
      assert.equal(result.stats.meanVolume, 2000);
      assert.equal(result.stats.meanLiquidity, 2000);

      // For two values, median is the same as mean
      assert.equal(result.stats.medianVolume, 2000);
      assert.equal(result.stats.medianLiquidity, 2000);
    });

    it('should calculate statistics with odd number of values', () => {
      const markets = [
        createMarket('low', 1000, 1000),
        createMarket('mid', 2000, 2000),
        createMarket('high', 3000, 3000),
      ];

      const result = marketFilter.filterMarkets(markets);

      // Mean should be (1000 + 2000 + 3000) / 3 = 2000
      assert.equal(result.stats.meanVolume, 2000);
      // Median should be middle value = 2000
      assert.equal(result.stats.medianVolume, 2000);
    });

    it('should handle skewed distributions', () => {
      const markets = [
        createMarket('tiny', 100, 100),
        createMarket('small', 1000, 1000),
        createMarket('huge', 100000, 100000),
      ];

      const result = marketFilter.filterMarkets(markets);

      // Mean will be heavily affected by the huge value
      assert.ok(
        result.stats.meanVolume > result.stats.medianVolume,
        'Mean should be larger than median in right-skewed distribution'
      );
    });
  });

  describe('Market Scoring', () => {
    it('should normalize and compare market metrics correctly', () => {
      const markets = [
        createMarket('high_volume', 10000, 1000), // High volume only
        createMarket('high_both', 8000, 8000), // High in both metrics
        createMarket('high_liquidity', 1000, 10000), // High liquidity only
      ];

      const result = marketFilter.filterMarkets(markets, {
        targetCount: 1,
        timeWeight: false,
      });

      // Market with balanced high metrics should win
      assert.equal(result.markets[0].id, 'high_both');
    });

    it('should handle market skew appropriately', () => {
      const markets = [
        createMarket('whale', 100000, 1000), // Very high volume
        createMarket('balanced1', 5000, 5000), // Medium balanced
        createMarket('balanced2', 4000, 4000), // Medium balanced
        createMarket('balanced3', 3000, 3000), // Medium balanced
      ];

      const result = marketFilter.filterMarkets(markets, {
        targetCount: 2,
        timeWeight: false,
      });

      // First should be whale due to extreme volume
      assert.equal(result.markets[0].id, 'whale');
      // Second should be highest balanced market
      assert.equal(result.markets[1].id, 'balanced1');
    });
  });

  describe('Time Weighting', () => {
    it('should prioritize recent markets when timeWeight is true', () => {
      const markets = [
        createMarket('old', 10000, 10000, 60), // High metrics but old
        createMarket('new', 8000, 8000, 0), // Slightly lower metrics but new
      ];

      const result = marketFilter.filterMarkets(markets, {
        targetCount: 1,
        timeWeight: true,
      });

      assert.equal(result.markets[0].id, 'new');
    });
  });
});
