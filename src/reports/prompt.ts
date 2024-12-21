import { ParentMarket } from '../markets/markets-schemas.js';
import { FilterResult } from '../markets/market-filter.js';

export function formatPrompt(
  currentMarkets: FilterResult,
  previousMarkets: FilterResult,
  latestReport: string | null
): string {
  const now = new Date();
  const timestamp = now.toISOString();

  return `
TIMESTAMP: ${timestamp}

Generate a report in exactly this format, with no deviations:

PRICE PREDICTIONS
[closest specific date of the month] targets
BTC
- $[PRICE]: [XX]% ([change %]) [Vol: $[XX]M]
[ordered by volume, >$25K volume and >2% probability only]

ETH
- $[PRICE]: [XX]% ([change %]) [Vol: $[XX]M]
[ordered by volume, >$25K volume and >2% probability only]

SOL
- $[PRICE]: [XX]% ([change %]) [Vol: $[XX]M]
[ordered by volume, >$25K volume and >2% probability only]

[CURRENT_MONTH YEAR] targets
[same format for each asset]

[NEXT_QUARTER YEAR] targets
[same format for each asset]

Rules:
1. Use (-) for no change
2. Use (↑5%) format for increases
3. Use (↓5%) format for decreases
4. Never show (↑0%) or (↓0%)
5. Order everything by volume descending
6. Include only >$25K volume and >2% probability
7. Round all numbers to nearest 0.5%
8. Use M for millions, K for thousands
9. Extract timeframes from market data
10. Keep exact formatting and spacing shown above
11. Do not include asset row if no volume or no targets for time period
12. If market is present in current markets data, but not in previous, show (NEW) in the end of the row

Do not include any notes.

REFERENCE DATA:
CURRENT MARKET DATA:
${currentMarkets.markets.map(formatMarketForPrompt).join('\n')}

PREVIOUS MARKET DATA:
${previousMarkets.markets.map(formatMarketForPrompt).join('\n')}

LATEST REPORT:
${latestReport || 'No previous report available'}
`;
}

export function formatMarketForPrompt(market: ParentMarket): string {
  return `
MARKET-ID: ${market.id}
TITLE: ${market.title}
VOL: $${formatNumber(market.volume)}
LIQ: $${formatNumber(market.liquidity)}
CHILDREN:
${market.childMarkets
  .map(
    (child) => `
ID: ${child.id}
Q: ${child.question}
OUTCOMES: ${child.outcomes.join(' / ')}
PRICES: ${child.outcomePrices.join(' / ')}
VOL: $${formatNumber(child.volume)}
`
  )
  .join('')}
---`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}
