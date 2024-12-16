import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { formatMarketForPrompt, formatPrompt } from '../reports/prompt.js';
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

* What will be the price of BTC in 6 months?
- Outcome Prices: 0.6, 0.4
- Volume: 200
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
`;

    const formatted = formatMarketForPrompt(mockMarket);
    assert.equal(
      formatted.trim(),
      expected.trim(),
      'Formatted market should handle no child markets gracefully'
    );
  });

  it('should format the complete prompt correctly', () => {
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
      },
    ];

    const historicalMarkets: ParentMarket[] = [
      {
        id: 'market2',
        title: 'Market 2',
        startDate: '2022-01-01',
        endDate: '2022-12-31',
        active: false,
        closed: true,
        liquidity: 800.0,
        volume: 4000.0,
        childMarkets: [
          {
            id: 'child2',
            parent_market_id: 'market2',
            question: 'Will ETH reach $4,000 by end of the year?',
            outcomes: ['Yes', 'No'],
            outcomePrices: ['0.7', '0.3'],
            volume: 150.0,
            active: false,
            closed: true,
          },
        ],
      },
    ];

    const latestReport = 'This is the latest market analysis report.';

    const expectedPrompt = `
### Latest Report ###
This is the latest market analysis report.

### Historical Market Data ###
- Market ID: market2
- Title: Market 2
- Liquidity: 800
- Volume: 4000
- Child Markets:

* Will ETH reach $4,000 by end of the year?
- Outcome Prices: 0.7, 0.3
- Volume: 150

### Current Market Data ###
- Market ID: market1
- Title: Market 1
- Liquidity: 1000
- Volume: 5000
- Child Markets:

* What will be the price of BTC in 6 months?
- Outcome Prices: 0.6, 0.4
- Volume: 200

### Task ###
Provide a detailed analysis of the current market data compared to the historical market data.

Focus on:
1. Markets with the **highest volume and liquidity**.
2. **Major assets**, such as Bitcoin, Ethereum, and Solana, while including other prominent assets.

**Output Format**:

---

### Assets ###
- **[Asset Name]**
- **Long-term:** [Analysis with probabilities and trends from historical data].
- **Mid-term:** [Analysis with probabilities and trends from historical data].
- **Short-term:** [Analysis with probabilities and trends from historical data].

### Additional Insights ###
#### **Airdrops**:
- *[Airdrop Name]*:
- **Yes:** [Probability for Yes].
- **No:** [Probability for No].
- Likelihood: [Description of the event based on "Yes" probability].

#### **Events**:
- *[Event Name]*:
- **Yes:** [Probability for Yes].
- **No:** [Probability for No].
- Likelihood: [Description of the event based on "Yes" probability].

#### **Listings**:
- *[Token Name]*:
- **Yes:** [Probability for Yes].
- **No:** [Probability for No].
- Likelihood: [Description of the event based on "Yes" probability].

---

**Guidelines**:

1. **Probabilities & Outcomes**:
- Include both "Yes" and "No" probabilities.
- Describe the likelihood **only for the event occurring ("Yes" probability)**:
- **0%-10%:** Highly unlikely.
- **10%-30%:** Unlikely.
- **30%-60%:** Moderate chance.
- **60%-90%:** Likely.
- **90%-100%:** Highly likely.

- Example:
- *Event:* MSFT shareholders vote for Bitcoin investment.  
- **Yes:** 0.35%.  
- **No:** 99.65%.  
- Likelihood: Highly unlikely.

2. **Historical Trends**:
- Compare probabilities with historical data and highlight changes (e.g., "up from 30% to 40%" or "trend unchanged").

3. **Focus Areas**:
- Prioritize markets with the **most volume and liquidity**.
- Always include Bitcoin, Ethereum, and Solana.
- Include only airdrops and events with significant volume and liquidity.
- Avoid listing low-impact items (e.g., those with extremely low probabilities and low market activity).
- Focus on the airdrops, events, and listings most likely to affect the broader market or specific major assets.
- Group similar items where appropriate to reduce verbosity (e.g., multiple airdrops with extremely low probabilities can be summarized).

4. **Exclusions**:
- Avoid speculation about outcomes not directly supported by market data.
- Do not include preambles, disclaimers, or "not financial advice" statements.
        `;

    const generatedPrompt = formatPrompt(
      currentMarkets,
      historicalMarkets,
      latestReport
    );
    assert.equal(
      generatedPrompt.trim(),
      expectedPrompt.trim(),
      'Generated prompt should match the expected format'
    );
  });
});
