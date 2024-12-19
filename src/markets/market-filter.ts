import { ParentMarket } from './markets-schemas.js';

/**
 * Statistical metrics used for market analysis and normalization.
 */
interface MarketStats {
  volumeMean: number;
  volumeMedian: number;
  liquidityMean: number;
  liquidityMedian: number;
  volumeMax: number;
  liquidityMax: number;
}

/**
 * Options for market filtering.
 */
interface FilterOptions {
  /** Number of markets to return. Defaults to 25% of total markets */
  targetCount?: number;
  /** Whether to apply time-based decay to scores. Defaults to true */
  timeWeight?: boolean;
  /** Minimum score threshold (0-1). Defaults to 0.1 */
  minScore?: number;
}

/**
 * Result of market filtering operation.
 */
interface FilterResult {
  /** Filtered markets */
  markets: ParentMarket[];
  /** Market statistics */
  stats: {
    totalMarkets: number;
    meanVolume: number;
    meanLiquidity: number;
    medianVolume: number;
    medianLiquidity: number;
  };
}

/**
 * MarketFilter provides functionality to filter and prioritize markets based on
 * various metrics like volume, liquidity, and age. It uses a scoring system
 * that adapts to current market conditions.
 */
export class MarketFilter {
  /**
   * Calculates a market's score based on its metrics and current market conditions.
   *
   * @param market - The market to score
   * @param stats - Current market statistics for normalization
   * @param timeWeight - Whether to apply time-based weighting
   * @returns A score between 0 and 1
   */
  private calculateMarketScore(
    market: ParentMarket,
    stats: MarketStats,
    timeWeight: boolean = true
  ): number {
    // Normalize metrics to 0-1 scale to make them comparable
    const normalizedVolume = market.volume / stats.volumeMax;
    const normalizedLiquidity = market.liquidity / stats.liquidityMax;

    // Adjust weights based on volume distribution
    // When volume is highly skewed (mean >> median), we give more weight to volume
    // This helps identify truly significant markets in volatile conditions
    const volumeSkew = stats.volumeMean / stats.volumeMedian;
    const volumeWeight = volumeSkew > 3 ? 0.7 : 0.5;
    const liquidityWeight = 1 - volumeWeight;

    // Calculate base score
    let score =
      normalizedVolume * volumeWeight + normalizedLiquidity * liquidityWeight;

    // Apply time weighting if enabled
    if (timeWeight) {
      score *= this.calculateTimeWeight(market.startDate);
    }

    return score;
  }

  /**
   * Calculates time-based weight for a market based on its age.
   * Uses exponential decay but maintains a minimum weight for older markets.
   */
  private calculateTimeWeight(startDate: string): number {
    const age = Date.now() - new Date(startDate).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);

    // 30-day half-life with 0.3 minimum weight
    // This ensures older markets can still be included if they're significant
    return Math.max(0.3, Math.exp(-daysOld / 30));
  }

  /**
   * Calculates various statistical measures for market metrics.
   * Used to normalize scores and adjust weights based on market conditions.
   */
  private getMarketStats(markets: ParentMarket[]): MarketStats {
    const volumes = markets.map((m) => m.volume);
    const liquidities = markets.map((m) => m.liquidity);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const mean = (arr: number[]) => sum(arr) / arr.length;
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };
    const max = (arr: number[]) => Math.max(...arr);

    return {
      volumeMean: mean(volumes),
      volumeMedian: median(volumes),
      liquidityMean: mean(liquidities),
      liquidityMedian: median(liquidities),
      volumeMax: max(volumes),
      liquidityMax: max(liquidities),
    };
  }

  /**
   * Filters markets based on their significance and current market conditions.
   *
   * @param markets - Array of markets to filter
   * @param options - Filtering options
   * @returns Filtered markets and market statistics
   */
  filterMarkets(
    markets: ParentMarket[],
    options: FilterOptions = {}
  ): FilterResult {
    if (markets.length === 0) {
      return {
        markets: [],
        stats: {
          totalMarkets: 0,
          meanVolume: 0,
          meanLiquidity: 0,
          medianVolume: 0,
          medianLiquidity: 0,
        },
      };
    }

    const stats = this.getMarketStats(markets);

    // Score and sort markets
    const marketsWithScores = markets.map((market) => ({
      market,
      score: this.calculateMarketScore(market, stats, options.timeWeight),
    }));

    const sorted = marketsWithScores.sort((a, b) => b.score - a.score);

    // Apply filtering
    const {
      targetCount = Math.ceil(markets.length * 0.25), // Default to 25% of markets
      minScore = 0.1, // Minimum significance threshold
    } = options;

    const filtered = sorted
      .filter((m) => m.score >= minScore)
      .slice(0, targetCount)
      .map((m) => m.market);

    return {
      markets: filtered,
      stats: {
        totalMarkets: markets.length,
        meanVolume: stats.volumeMean,
        meanLiquidity: stats.liquidityMean,
        medianVolume: stats.volumeMedian,
        medianLiquidity: stats.liquidityMedian,
      },
    };
  }
}
