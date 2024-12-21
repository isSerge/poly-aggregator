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
 * Market category stats for asset-specific normalization
 */
interface CategoryStats {
  [category: string]: MarketStats;
}

/**
 * Options for market filtering.
 */
interface FilterOptions {
  /** Number of markets to return. Defaults to 25% of total markets */
  targetCount?: number;
  /** Whether to apply time-based decay to scores. Defaults to true */
  timeWeight?: boolean;
  /** Minimum score threshold (0-1). Defaults to 0.05 */
  minScore?: number;
  /** Whether to normalize within asset categories. Defaults to true */
  categoryNormalization?: boolean;
}

/**
 * Result of market filtering operation.
 */
export interface FilterResult {
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
 * various metrics like volume, liquidity, and age. It uses adaptive scoring that
 * considers both global and asset-specific metrics.
 */
export class MarketFilter {
  /**
   * Determines the asset category of a market
   */
  private getMarketCategory(market: ParentMarket): string {
    const title = market.title.toLowerCase();
    if (title.includes('bitcoin') || title.includes('btc')) return 'BTC';
    if (title.includes('ethereum') || title.includes('eth')) return 'ETH';
    if (title.includes('solana') || title.includes('sol')) return 'SOL';
    return 'OTHER';
  }

  /**
   * Calculates category-specific statistics for all markets
   */
  private getCategoryStats(markets: ParentMarket[]): CategoryStats {
    const categorizedMarkets: { [key: string]: ParentMarket[] } = {};

    // Group markets by category
    markets.forEach((market) => {
      const category = this.getMarketCategory(market);
      if (!categorizedMarkets[category]) {
        categorizedMarkets[category] = [];
      }
      categorizedMarkets[category].push(market);
    });

    // Calculate stats for each category
    const categoryStats: CategoryStats = {};
    Object.entries(categorizedMarkets).forEach(
      ([category, categoryMarkets]) => {
        categoryStats[category] = this.getMarketStats(categoryMarkets);
      }
    );

    return categoryStats;
  }

  /**
   * Calculates a market's score based on its metrics and market conditions.
   */
  private calculateMarketScore(
    market: ParentMarket,
    globalStats: MarketStats,
    categoryStats: CategoryStats,
    options: Required<FilterOptions>
  ): number {
    const category = this.getMarketCategory(market);
    const stats =
      options.categoryNormalization && categoryStats[category]
        ? categoryStats[category]
        : globalStats;

    // Normalize metrics to 0-1 scale
    const normalizedVolume = market.volume / stats.volumeMax;
    const normalizedLiquidity = market.liquidity / stats.liquidityMax;

    // Adjust weights based on volume distribution
    const volumeSkew = stats.volumeMean / stats.volumeMedian;
    const volumeWeight = volumeSkew > 3 ? 0.6 : 0.5; // Reduced from 0.7 to 0.6
    const liquidityWeight = 1 - volumeWeight;

    // Calculate base score
    let score =
      normalizedVolume * volumeWeight + normalizedLiquidity * liquidityWeight;

    // Add category boost for non-major assets to improve inclusion
    if (category !== 'BTC' && category !== 'ETH') {
      score *= 1.2; // 20% boost for non-major assets
    }

    // Apply time weighting if enabled
    if (options.timeWeight) {
      score *= this.calculateTimeWeight(market.startDate);
    }

    return score;
  }

  /**
   * Calculates time-based weight for a market based on its age.
   */
  private calculateTimeWeight(startDate: string): number {
    const age = Date.now() - new Date(startDate).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);
    return Math.max(0.3, Math.exp(-daysOld / 30));
  }

  /**
   * Calculates various statistical measures for market metrics.
   */
  private getMarketStats(markets: ParentMarket[]): MarketStats {
    const volumes = markets.map((m) => m.volume);
    const liquidities = markets.map((m) => m.liquidity);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const mean = (arr: number[]) => sum(arr) / arr.length;
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
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

    const fullOptions: Required<FilterOptions> = {
      targetCount: options.targetCount ?? Math.ceil(markets.length * 0.3), // Increased from 0.25 to 0.3
      timeWeight: options.timeWeight ?? true,
      minScore: options.minScore ?? 0.05, // Lowered from 0.1 to 0.05
      categoryNormalization: options.categoryNormalization ?? true,
    };

    const globalStats = this.getMarketStats(markets);
    const categoryStats = this.getCategoryStats(markets);

    // Score and sort markets
    const marketsWithScores = markets.map((market) => ({
      market,
      score: this.calculateMarketScore(
        market,
        globalStats,
        categoryStats,
        fullOptions
      ),
    }));

    const sorted = marketsWithScores.sort((a, b) => b.score - a.score);

    // Apply filtering
    const filtered = sorted
      .filter((m) => m.score >= fullOptions.minScore)
      .slice(0, fullOptions.targetCount)
      .map((m) => m.market);

    return {
      markets: filtered,
      stats: {
        totalMarkets: markets.length,
        meanVolume: globalStats.volumeMean,
        meanLiquidity: globalStats.liquidityMean,
        medianVolume: globalStats.volumeMedian,
        medianLiquidity: globalStats.liquidityMedian,
      },
    };
  }
}
