import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { formatMarketForPrompt } from '../reports/prompt.js';
import { ParentMarket } from '../markets/markets-schemas.js';

describe('Prompt Module', () => {
  it('should format a single market correctly', () => {
    const mockMarket: ParentMarket = {
      id: 'market1',
      title: 'Market 1',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      active: true,
      closed: false,
      liquidity: 1000.0,
      volume: 5000.0,
      childMarkets: [
        {
          id: 'child1',
          parent_market_id: 'market1',
          question: 'What will be the price of BTC in 6 months?',
          outcomes: ['$50,000', '$60,000'],
          outcomePrices: ['0.6', '0.4'],
          volume: 200.0,
          active: true,
          closed: false,
        },
      ],
    };

    const expected = `
- Market ID: market1
- Title: Market 1
- Liquidity: 1000
- Volume: 5000
- Child Markets:

-- Market ID: child1
-- Title: What will be the price of BTC in 6 months?
-- Outcomes: $50,000, $60,000
-- Outcome Prices: 0.6, 0.4
-- Volume: 200

------------------
`;

    const formatted = formatMarketForPrompt(mockMarket);
    assert.equal(
      formatted.trim(),
      expected.trim(),
      'Formatted market should match expected output'
    );
  });

  it('should handle markets with no child markets', () => {
    const mockMarket: ParentMarket = {
      id: 'market2',
      title: 'Market 2',
      startDate: '2023-02-01',
      endDate: '2023-11-30',
      active: true,
      closed: false,
      liquidity: 800.0,
      volume: 4000.0,
      childMarkets: [],
    };

    const expected = `
- Market ID: market2
- Title: Market 2
- Liquidity: 800
- Volume: 4000
- Child Markets:
None
------------------
`;

    const formatted = formatMarketForPrompt(mockMarket);
    assert.equal(
      formatted.trim(),
      expected.trim(),
      'Formatted market should handle no child markets gracefully'
    );
  });
});
