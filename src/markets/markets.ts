import { DatabaseManager } from '../db/db.js';
import { logger } from '../logger.js';
import { prepareTyped, TypedStatement } from '../db/types.js';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { ParentMarket, MarketRow, MarketRowSchema } from './markets-schemas.js';

// Types that match the actual database structure
interface DbMarket {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  liquidity: number;
  volume: number;
  [key: string]: string | number | boolean | null;
}

interface DbChildMarket {
  id: string;
  parent_market_id: string;
  question: string;
  outcomes: string;
  outcome_prices: string;
  volume: number;
  [key: string]: string | number | boolean | null;
}

// For handling validation results
interface ValidationResult<T> {
  validRows: T[];
  invalidRows: Array<{
    row: unknown;
    errors: z.ZodError;
  }>;
}

// Result types for insert operations
type InsertResult = { lastInsertRowid: number } | { changes: number };

export class MarketRepository {
  private readonly db: Database;
  private readonly insertMarket: TypedStatement<DbMarket, InsertResult>;
  private readonly insertChildMarket: TypedStatement<
    DbChildMarket,
    InsertResult
  >;

  constructor(dbManager: DatabaseManager) {
    this.db = dbManager.getConnection();

    this.insertMarket = prepareTyped(
      this.db,
      `INSERT OR REPLACE INTO markets (
        id, title, start_date, end_date, liquidity, volume
      ) VALUES (
        @id, @title, @start_date, @end_date, @liquidity, @volume
      )`,
      z.object({
        lastInsertRowid: z.number(),
        changes: z.number(),
      })
    );

    this.insertChildMarket = prepareTyped(
      this.db,
      `INSERT OR REPLACE INTO child_markets (
        id, parent_market_id, question, outcomes, outcome_prices, volume
      ) VALUES (
        @id, @parent_market_id, @question, @outcomes, @outcome_prices, @volume
      )`,
      z.object({
        lastInsertRowid: z.number(),
        changes: z.number(),
      })
    );
  }

  private createDeleteStatementForIds(ids: string[]) {
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      return this.db.prepare(
        `DELETE FROM markets WHERE id NOT IN (${placeholders})`
      );
    }
    return this.db.prepare('DELETE FROM markets');
  }

  public saveMarkets(currentMarkets: ParentMarket[]): void {
    const currentMarketIds = currentMarkets.map((market) => market.id);
    const deleteClosedMarkets =
      this.createDeleteStatementForIds(currentMarketIds);

    const transaction = this.db.transaction((markets: ParentMarket[]) => {
      for (const market of markets) {
        const dbMarket: DbMarket = {
          id: market.id,
          title: market.title,
          start_date: market.startDate,
          end_date: market.endDate ?? null,
          liquidity: market.liquidity,
          volume: market.volume,
        };
        this.insertMarket.run(dbMarket);

        for (const childMarket of market.childMarkets) {
          const dbChildMarket: DbChildMarket = {
            id: childMarket.id,
            parent_market_id: childMarket.parent_market_id,
            question: childMarket.question,
            outcomes: JSON.stringify(childMarket.outcomes),
            outcome_prices: JSON.stringify(childMarket.outcomePrices),
            volume: childMarket.volume,
          };
          this.insertChildMarket.run(dbChildMarket);
        }
      }

      if (currentMarketIds.length > 0) {
        deleteClosedMarkets.run(...currentMarketIds);
      } else {
        deleteClosedMarkets.run();
      }
    });

    try {
      transaction(currentMarkets);
      logger.info('Successfully saved markets and removed closed markets');
    } catch (error) {
      logger.error(error, 'Failed to save markets');
      throw error;
    }
  }

  public getActiveMarkets(): ParentMarket[] {
    const rows = this.db
      .prepare(
        `
    SELECT 
      markets.id AS market_id,
      markets.title,
      markets.start_date,
      markets.end_date,
      markets.liquidity,
      markets.volume,
      child_markets.id AS child_id,
      child_markets.question,
      child_markets.outcomes,
      child_markets.outcome_prices,
      child_markets.volume AS child_volume,
      markets.created_at,
      markets.updated_at
    FROM markets
    LEFT JOIN child_markets ON markets.id = child_markets.parent_market_id
  `
      )
      .all();

    const { validRows, invalidRows } = rows.reduce<ValidationResult<MarketRow>>(
      (acc: ValidationResult<MarketRow>, row: unknown) => {
        const result = MarketRowSchema.safeParse(row);
        if (result.success) {
          acc.validRows.push(result.data);
        } else {
          acc.invalidRows.push({ row, errors: result.error });
        }
        return acc;
      },
      { validRows: [], invalidRows: [] }
    );

    if (invalidRows.length > 0) {
      for (const { row, errors } of invalidRows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marketId = (row as any).market_id || 'Unknown ID';
        logger.warn(
          `Row validation failed for market_id ${marketId}:`,
          errors.errors
        );
      }
    }

    return this.transformToParentMarkets(validRows);
  }

  private transformToParentMarkets(rows: MarketRow[]): ParentMarket[] {
    const marketMap = new Map<string, ParentMarket>();

    for (const row of rows) {
      if (!marketMap.has(row.market_id)) {
        marketMap.set(row.market_id, {
          id: row.market_id,
          title: row.title,
          startDate: row.start_date,
          endDate: row.end_date,
          liquidity: row.liquidity,
          volume: row.volume,
          childMarkets: [],
        });
      }

      if (row.child_id) {
        const parent = marketMap.get(row.market_id)!;
        parent.childMarkets.push({
          id: row.child_id,
          parent_market_id: row.market_id,
          question: row.question || '',
          outcomes: JSON.parse(row.outcomes || '[]'),
          outcomePrices: JSON.parse(row.outcome_prices || '[]'),
          volume: row.child_volume || 0,
        });
      }
    }

    return Array.from(marketMap.values());
  }
}
