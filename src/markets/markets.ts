import { logger } from '../logger.js';
import { ParentMarket, MarketRow, MarketRowSchema } from './markets-schemas.js';
import { DatabaseType, DatabaseManager } from '../db/db.js';

export class MarketRepository {
  private readonly db: DatabaseType;

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager.getConnection();
  }

  saveCurrentMarkets(currentMarkets: ParentMarket[]) {
    const insertMarket = this.db.prepare(`
      INSERT OR REPLACE INTO markets (id, title, start_date, end_date, active, closed, liquidity, volume)
      VALUES (@id, @title, @start_date, @end_date, @active, @closed, @liquidity, @volume)
    `);

    const insertChildMarket = this.db.prepare(`
      INSERT OR REPLACE INTO child_markets (id, parent_market_id, question, outcomes, outcome_prices, volume, active, closed)
      VALUES (@id, @parent_market_id, @question, @outcomes, @outcome_prices, @volume, @active, @closed)
    `);

    const transaction = this.db.transaction((markets: ParentMarket[]) => {
      for (const market of markets) {
        insertMarket.run({
          ...market,
          start_date: market.startDate,
          end_date: market.endDate,
          active: market.active ? 1 : 0,
          closed: market.closed ? 1 : 0,
        });

        for (const childMarket of market.childMarkets || []) {
          insertChildMarket.run({
            id: childMarket.id,
            parent_market_id: market.id,
            question: childMarket.question,
            outcomes: JSON.stringify(childMarket.outcomes),
            outcome_prices: JSON.stringify(childMarket.outcomePrices),
            volume: childMarket.volume,
            active: childMarket.active ? 1 : 0,
            closed: childMarket.closed ? 1 : 0,
          });
        }
      }
    });

    transaction(currentMarkets);
    logger.info('Successfully saved current markets');
  }

  getHistoricalData(): ParentMarket[] {
    const rows = this.db
      .prepare(
        `
        SELECT * FROM markets
        LEFT JOIN child_markets ON markets.id = child_markets.parent_market_id
      `
      )
      .all();

    const validRows = rows
      .map((row) => MarketRowSchema.safeParse(row))
      .filter((result) => result.success)
      .map((result) => result.data);

    const markets = validRows.reduce(
      (acc: Record<string, ParentMarket>, row: MarketRow) => {
        const parent = acc[row.id] || {
          id: row.id,
          title: row.title,
          startDate: row.start_date,
          endDate: row.end_date,
          active: !!row.active,
          closed: !!row.closed,
          liquidity: row.liquidity,
          volume: row.volume,
          childMarkets: [],
        };

        if (row.parent_market_id) {
          parent.childMarkets.push({
            id: row.child_markets_id || '',
            question: row.question || '',
            outcomes: JSON.parse(row.outcomes || '[]'),
            outcomePrices: JSON.parse(row.outcome_prices || '[]'),
            volume: row.child_markets_volume || 0,
            active: !!row.child_markets_active,
            closed: !!row.child_markets_closed,
          });
        }

        acc[row.id] = parent;
        return acc;
      },
      {}
    );

    return Object.values(markets);
  }
}
