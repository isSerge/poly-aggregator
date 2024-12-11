import * as uuid from 'uuid';
import { logger } from './logger.js';
import { ParentMarket, MarketRow, MarketRowSchema } from './types.js';
import { db } from './db.js';

export function saveCurrentMarkets(currentMarkets: ParentMarket[]) {
  const insertMarket = db.prepare(`
      INSERT OR REPLACE INTO markets (id, title, start_date, end_date, active, closed, liquidity, volume)
      VALUES (@id, @title, @start_date, @end_date, @active, @closed, @liquidity, @volume)
    `);

  const insertChildMarket = db.prepare(`
      INSERT OR REPLACE INTO child_markets (id, parent_market_id, question, outcomes, outcome_prices, volume, active, closed)
      VALUES (@id, @parent_market_id, @question, @outcomes, @outcome_prices, @volume, @active, @closed)
    `);

  const transaction = db.transaction((markets: ParentMarket[]) => {
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

export function getHistoricalData(): ParentMarket[] {
  const rows = db
    .prepare(
      `
      SELECT * FROM markets
      LEFT JOIN child_markets ON markets.id = child_markets.parent_market_id
    `
    )
    .all();

  // Validate and parse rows using Zod
  const validRows = rows
    .map((row) => MarketRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data); // Extract valid data

  // Group child markets under their parent
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
          id: row.child_markets_id || '', // Ensure id is a string
          question: row.question || '', // Ensure question is a string
          outcomes: JSON.parse(row.outcomes || '[]'), // Parse outcomes
          outcomePrices: JSON.parse(row.outcome_prices || '[]'), // Parse outcome prices
          volume: row.child_markets_volume || 0, // Default to 0 if undefined
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

export function saveReport(reportContent: string) {
  const stmt = db.prepare(`
      INSERT INTO reports (id, content, created_at)
      VALUES (?, ?, datetime('now'))
    `);
  stmt.run(uuid.v4(), reportContent);
  logger.info('Report saved successfully');
}

export function getLatestReport() {
  const row = db
    .prepare(
      `
      SELECT content FROM reports ORDER BY created_at DESC LIMIT 1
    `
    )
    .get() as { content: string } | undefined;
  return row ? row.content : null;
}
