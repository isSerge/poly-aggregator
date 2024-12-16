import { logger } from '../logger.js';
import { ParentMarket, MarketRow, MarketRowSchema } from './markets-schemas.js';
import { DatabaseType, DatabaseManager } from '../db/db.js';
import { z } from 'zod';

interface ValidationResult<T> {
  validRows: T[];
  invalidRows: InvalidRow[];
}

interface InvalidRow {
  row: unknown;
  errors: z.ZodIssue[];
}

export class MarketRepository {
  private readonly db: DatabaseType;

  public constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager.getConnection();
  }

  private createDeleteStatementForIds(ids: string[]) {
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      return this.db.prepare(
        `DELETE FROM markets WHERE id NOT IN (${placeholders})`
      );
    } else {
      // If no current markets, delete all markets
      return this.db.prepare(`DELETE FROM markets`);
    }
  }

  public saveMarkets(currentMarkets: ParentMarket[]) {
    const insertMarket = this.db.prepare(`
      INSERT OR REPLACE INTO markets (id, title, start_date, end_date, active, closed, liquidity, volume)
      VALUES (@id, @title, @start_date, @end_date, @active, @closed, @liquidity, @volume)
    `);

    const insertChildMarket = this.db.prepare(`
      INSERT OR REPLACE INTO child_markets (id, parent_market_id, question, outcomes, outcome_prices, volume, active, closed)
      VALUES (@id, @parent_market_id, @question, @outcomes, @outcome_prices, @volume, @active, @closed)
    `);

    // Extract current market IDs
    const currentMarketIds = currentMarkets.map((market) => market.id);

    // Prepare the delete statement to remove closed markets
    const deleteClosedMarkets =
      this.createDeleteStatementForIds(currentMarketIds);

    const transaction = this.db.transaction((markets: ParentMarket[]) => {
      for (const market of markets) {
        insertMarket.run({
          id: market.id,
          title: market.title,
          start_date: market.startDate,
          end_date: market.endDate,
          active: market.active ? 1 : 0,
          closed: market.closed ? 1 : 0,
          liquidity: market.liquidity,
          volume: market.volume,
        });
        logger.info(`Inserted/Updated market with ID: ${market.id}`);

        for (const childMarket of market.childMarkets || []) {
          insertChildMarket.run({
            id: childMarket.id,
            parent_market_id: childMarket.parent_market_id,
            question: childMarket.question,
            outcomes: JSON.stringify(childMarket.outcomes),
            outcome_prices: JSON.stringify(childMarket.outcomePrices),
            volume: childMarket.volume,
            active: childMarket.active ? 1 : 0,
            closed: childMarket.closed ? 1 : 0,
          });
          logger.info(
            `Inserted/Updated child market with ID: ${childMarket.id}`
          );
        }
      }

      // Delete closed markets after all insertions/updates
      if (currentMarketIds.length > 0) {
        deleteClosedMarkets.run(...currentMarketIds);
        logger.info('Deleted closed markets');
      } else {
        deleteClosedMarkets.run();
        logger.info('Deleted all markets');
      }
    });

    try {
      transaction(currentMarkets);
      logger.info(
        'Successfully saved current markets and removed closed markets'
      );
    } catch (error) {
      logger.error(error, 'Transaction failed and was rolled back');
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
        markets.active AS market_active,
        markets.closed AS market_closed,
        markets.liquidity,
        markets.volume,
        child_markets.id AS child_id,
        child_markets.question,
        child_markets.outcomes,
        child_markets.outcome_prices,
        child_markets.volume AS child_volume,
        child_markets.active AS child_active,
        child_markets.closed AS child_closed
      FROM markets
      LEFT JOIN child_markets ON markets.id = child_markets.parent_market_id
      WHERE markets.active = 1 AND markets.closed = 0
    `
      )
      .all();

    const { validRows, invalidRows }: ValidationResult<MarketRow> = rows.reduce(
      (acc: ValidationResult<MarketRow>, row: unknown) => {
        const result = MarketRowSchema.safeParse(row);
        if (result.success) {
          acc.validRows.push(result.data);
        } else {
          acc.invalidRows.push({ row, errors: result.error.errors });
        }
        return acc;
      },
      { validRows: [], invalidRows: [] }
    );

    if (invalidRows.length > 0) {
      logger.warn(
        invalidRows,
        'Some rows failed validation in getPreviousMarketData:'
      );
      // TODO: consider throwing an error
    }

    const markets = validRows.reduce(
      (acc: Record<string, ParentMarket>, row: MarketRow) => {
        const parent = acc[row.market_id] || {
          id: row.market_id,
          title: row.title,
          startDate: row.start_date,
          endDate: row.end_date,
          active: !!row.market_active,
          closed: !!row.market_closed,
          liquidity: row.liquidity,
          volume: row.volume,
          childMarkets: [],
        };

        if (row.child_id) {
          parent.childMarkets.push({
            id: row.child_id,
            parent_market_id: row.market_id,
            question: row.question || '',
            outcomes: JSON.parse(row.outcomes || '[]'),
            outcomePrices: JSON.parse(row.outcome_prices || '[]'),
            volume: row.child_volume || 0,
            active: !!row.child_active,
            closed: !!row.child_closed,
          });
        }

        acc[row.market_id] = parent;
        return acc;
      },
      {}
    );

    return Object.values(markets);
  }
}
