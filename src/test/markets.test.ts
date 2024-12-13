import { setupTest } from './utils/test-utils.js';
import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';
import { MarketRepository } from '../markets/markets.js';
import { ParentMarket } from '../markets/markets-schemas.js';

describe('MarketRepository', () => {
  const { getDbManager } = setupTest();
  let marketRepository: MarketRepository;

  beforeEach(() => {
    const dbManager = getDbManager();
    marketRepository = new MarketRepository(dbManager);
  });

  it('should save current markets without child markets', () => {
    const currentMarkets: ParentMarket[] = [
      {
        id: 'market1',
        title: 'Market 1',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        active: true,
        closed: false,
        liquidity: 1000.0,
        volume: 5000.0,
        childMarkets: [],
      },
    ];

    marketRepository.saveCurrentMarkets(currentMarkets);

    const db = getDbManager().getConnection();

    const savedMarket = db
      .prepare('SELECT * FROM markets WHERE id = ?')
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get('market1') as any;

    assert.ok(savedMarket, 'Inserted market should be retrieved');
    assert.equal(savedMarket.title, 'Market 1');
    assert.equal(savedMarket.active, 1);
    assert.equal(savedMarket.closed, 0);
    assert.equal(savedMarket.liquidity, 1000.0);
    assert.equal(savedMarket.volume, 5000.0);

    // Ensure no child markets are inserted
    const childMarkets = db
      .prepare('SELECT * FROM child_markets WHERE parent_market_id = ?')
      .all('market1');
    assert.deepEqual(childMarkets, [], 'No child markets should be inserted');
  });

  it('should save current markets with child markets', () => {
    const currentMarkets: ParentMarket[] = [
      {
        id: 'market2',
        title: 'Market 2',
        startDate: '2023-02-01',
        endDate: '2023-11-30',
        active: true,
        closed: false,
        liquidity: 2000.0,
        volume: 10000.0,
        childMarkets: [
          {
            id: 'child1',
            parent_market_id: 'market2',
            question: 'Outcome 1?',
            outcomes: ['Yes', 'No'],
            outcomePrices: ['1.5', '2.5'],
            volume: 300.0,
            active: true,
            closed: false,
          },
          {
            id: 'child2',
            parent_market_id: 'market2',
            question: 'Outcome 2?',
            outcomes: ['Option A', 'Option B'],
            outcomePrices: ['2.0', '3.0'],
            volume: 400.0,
            active: true,
            closed: false,
          },
        ],
      },
    ];

    marketRepository.saveCurrentMarkets(currentMarkets);

    const db = getDbManager().getConnection();

    const savedMarket = db
      .prepare('SELECT * FROM markets WHERE id = ?')
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get('market2') as any;

    const savedChild1 = db
      .prepare('SELECT * FROM child_markets WHERE id = ?')
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get('child1') as any;

    const savedChild2 = db
      .prepare('SELECT * FROM child_markets WHERE id = ?')
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get('child2') as any;

    assert.ok(savedMarket, 'Inserted market should be retrieved');
    assert.equal(savedMarket.title, 'Market 2');
    assert.equal(savedMarket.active, 1);
    assert.equal(savedMarket.closed, 0);
    assert.equal(savedMarket.liquidity, 2000.0);
    assert.equal(savedMarket.volume, 10000.0);

    assert.ok(savedChild1, 'Inserted child market1 should be retrieved');
    assert.equal(savedChild1.parent_market_id, 'market2');
    assert.equal(savedChild1.question, 'Outcome 1?');
    assert.equal(savedChild1.outcomes, JSON.stringify(['Yes', 'No']));
    assert.equal(savedChild1.outcome_prices, JSON.stringify(['1.5', '2.5']));
    assert.equal(savedChild1.volume, 300.0);
    assert.equal(savedChild1.active, 1);
    assert.equal(savedChild1.closed, 0);

    assert.ok(savedChild2, 'Inserted child market2 should be retrieved');
    assert.equal(savedChild2.parent_market_id, 'market2');
    assert.equal(savedChild2.question, 'Outcome 2?');
    assert.equal(
      savedChild2.outcomes,
      JSON.stringify(['Option A', 'Option B'])
    );
    assert.equal(savedChild2.outcome_prices, JSON.stringify(['2.0', '3.0']));
    assert.equal(savedChild2.volume, 400.0);
    assert.equal(savedChild2.active, 1);
    assert.equal(savedChild2.closed, 0);
  });

  it('should retrieve historical data correctly', () => {
    const currentMarkets: ParentMarket[] = [
      {
        id: 'market3',
        title: 'Market 3',
        startDate: '2023-03-01',
        endDate: '2023-10-31',
        active: false,
        closed: true,
        liquidity: 1500.0,
        volume: 7500.0,
        childMarkets: [
          {
            id: 'child3',
            parent_market_id: 'market3',
            question: 'Outcome 3?',
            outcomes: ['True', 'False'],
            outcomePrices: ['1.8', '2.2'],
            volume: 350.0,
            active: false,
            closed: true,
          },
        ],
      },
    ];

    marketRepository.saveCurrentMarkets(currentMarkets);

    const historicalData = marketRepository.getHistoricalData();

    assert.equal(historicalData.length, 1, 'Should retrieve one market');
    const market = historicalData[0];
    assert.equal(market.id, 'market3');
    assert.equal(market.title, 'Market 3');
    assert.equal(market.startDate, '2023-03-01');
    assert.equal(market.endDate, '2023-10-31');
    assert.equal(market.active, false);
    assert.equal(market.closed, true);
    assert.equal(market.liquidity, 1500.0);
    assert.equal(market.volume, 7500.0);
    assert.equal(market.childMarkets.length, 1, 'Should have one child market');
    assert.deepEqual(market.childMarkets[0], {
      id: 'child3',
      parent_market_id: 'market3',
      question: 'Outcome 3?',
      outcomes: ['True', 'False'],
      outcomePrices: ['1.8', '2.2'],
      volume: 350.0,
      active: false,
      closed: true,
    });
  });

  it('should handle inserting markets with duplicate IDs using OR REPLACE', () => {
    const initialMarkets: ParentMarket[] = [
      {
        id: 'market4',
        title: 'Market 4',
        startDate: '2023-04-01',
        endDate: '2023-09-30',
        active: true,
        closed: false,
        liquidity: 2500.0,
        volume: 12500.0,
        childMarkets: [],
      },
    ];

    const updatedMarkets: ParentMarket[] = [
      {
        id: 'market4', // Duplicate ID
        title: 'Market 4 Updated',
        startDate: '2023-04-15',
        endDate: '2023-10-15',
        active: false,
        closed: true,
        liquidity: 3000.0,
        volume: 15000.0,
        childMarkets: [],
      },
    ];

    // Insert initial market
    marketRepository.saveCurrentMarkets(initialMarkets);

    // Insert updated market
    marketRepository.saveCurrentMarkets(updatedMarkets);

    const db = getDbManager().getConnection();

    const savedMarket = db
      .prepare('SELECT * FROM markets WHERE id = ?')
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get('market4') as any;

    assert.ok(savedMarket, 'Inserted market should be retrieved');
    assert.equal(savedMarket.title, 'Market 4 Updated');
    assert.equal(savedMarket.start_date, '2023-04-15');
    assert.equal(savedMarket.end_date, '2023-10-15');
    assert.equal(savedMarket.active, 0);
    assert.equal(savedMarket.closed, 1);
    assert.equal(savedMarket.liquidity, 3000.0);
    assert.equal(savedMarket.volume, 15000.0);
  });

  it('should handle saving an empty array of markets gracefully', () => {
    const currentMarkets: ParentMarket[] = [];

    assert.doesNotThrow(() => {
      marketRepository.saveCurrentMarkets(currentMarkets);
    }, 'Saving an empty array should not throw an error');

    const historicalData = marketRepository.getHistoricalData();
    assert.deepEqual(historicalData, [], 'Historical data should be empty');
  });

  it('should save and retrieve multiple markets with child markets', () => {
    const currentMarkets: ParentMarket[] = [
      {
        id: 'market7',
        title: 'Market 7',
        startDate: '2023-07-01',
        endDate: '2023-12-31',
        active: true,
        closed: false,
        liquidity: 1900.0,
        volume: 9500.0,
        childMarkets: [
          {
            id: 'child7',
            parent_market_id: 'market7',
            question: 'Outcome 7?',
            outcomes: ['Option 1', 'Option 2'],
            outcomePrices: ['1.6', '2.4'],
            volume: 360.0,
            active: true,
            closed: false,
          },
        ],
      },
      {
        id: 'market8',
        title: 'Market 8',
        startDate: '2023-08-01',
        endDate: '2023-09-30',
        active: false,
        closed: true,
        liquidity: 2100.0,
        volume: 10500.0,
        childMarkets: [
          {
            id: 'child8',
            parent_market_id: 'market8',
            question: 'Outcome 8?',
            outcomes: ['Yes', 'No', 'Maybe'],
            outcomePrices: ['1.7', '2.3', '3.0'],
            volume: 420.0,
            active: false,
            closed: true,
          },
        ],
      },
    ];

    marketRepository.saveCurrentMarkets(currentMarkets);

    const historicalData = marketRepository.getHistoricalData();

    assert.equal(historicalData.length, 2, 'Should retrieve two markets');

    const market7 = historicalData.find((m) => m.id === 'market7');
    const market8 = historicalData.find((m) => m.id === 'market8');

    assert.ok(market7, 'Market 7 should exist');
    assert.equal(market7?.title, 'Market 7');
    assert.equal(
      market7?.childMarkets.length,
      1,
      'Market 7 should have one child market'
    );
    assert.deepEqual(market7?.childMarkets[0], {
      id: 'child7',
      parent_market_id: 'market7',
      question: 'Outcome 7?',
      outcomes: ['Option 1', 'Option 2'],
      outcomePrices: ['1.6', '2.4'],
      volume: 360.0,
      active: true,
      closed: false,
    });

    assert.ok(market8, 'Market 8 should exist');
    assert.equal(market8?.title, 'Market 8');
    assert.equal(
      market8?.childMarkets.length,
      1,
      'Market 8 should have one child market'
    );
    assert.deepEqual(market8?.childMarkets[0], {
      id: 'child8',
      parent_market_id: 'market8',
      question: 'Outcome 8?',
      outcomes: ['Yes', 'No', 'Maybe'],
      outcomePrices: ['1.7', '2.3', '3.0'],
      volume: 420.0,
      active: false,
      closed: true,
    });
  });

  it('should have foreign key constraints enabled', () => {
    const dbManager = getDbManager();
    const fkEnabled = dbManager.areForeignKeysEnabled();
    assert.ok(
      fkEnabled,
      `Foreign keys should be enabled, but got: ${fkEnabled}`
    );
  });

  it('should rollback transaction if an error occurs during saving markets', () => {
    const dbManager = getDbManager();
    const fkEnabled = dbManager.areForeignKeysEnabled();

    assert.ok(
      fkEnabled,
      `Foreign keys should be enabled, but got: ${fkEnabled}`
    );

    const faultyMarkets: ParentMarket[] = [
      {
        id: 'market6',
        title: 'Market 6',
        startDate: '2023-06-01',
        endDate: '2023-07-31',
        active: true,
        closed: false,
        liquidity: 2200.0,
        volume: 11000.0,
        childMarkets: [
          {
            id: 'child6',
            parent_market_id: 'nonexistent_market', // Invalid parent_market_id
            question: 'Outcome 6?',
            outcomes: ['Option X', 'Option Y'],
            outcomePrices: ['2.0', '3.0'], // Kept as strings
            volume: 500.0,
            active: true,
            closed: false,
          },
        ],
      },
    ];

    // Attempt to save faulty markets and expect an error
    try {
      marketRepository.saveCurrentMarkets(faultyMarkets);
      // If no error is thrown, fail the test
      assert.fail(
        'Expected an error due to foreign key constraint violation, but none was thrown.'
      );
      //   eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Check if the error message matches the foreign key constraint violation
      assert.match(
        error.message,
        /foreign key constraint failed/i,
        'Expected a foreign key constraint failure error'
      );
    }

    // Verify that neither the parent market nor the child market was inserted
    const db = getDbManager().getConnection();
    const savedMarket = db
      .prepare('SELECT * FROM markets WHERE id = ?')
      .get('market6');
    const savedChild = db
      .prepare('SELECT * FROM child_markets WHERE id = ?')
      .get('child6');

    assert.equal(
      savedMarket,
      undefined,
      'Parent market should not be inserted due to rollback'
    );
    assert.equal(
      savedChild,
      undefined,
      'Child market should not be inserted due to rollback'
    );
  });
});
