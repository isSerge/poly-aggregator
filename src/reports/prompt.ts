import { ParentMarket } from '../markets/markets-schemas.js';

/**
 * Formats a single market's data for inclusion in the prompt.
 * @param market - The market data to format.
 * @returns A formatted string representing the market.
 */
export function formatMarketForPrompt(market: ParentMarket): string {
  return `
- Market ID: ${market.id}
- Title: ${market.title}
- Liquidity: ${market.liquidity}
- Volume: ${market.volume}
- Child Markets:
${
  market.childMarkets && market.childMarkets.length > 0
    ? market.childMarkets
        .map(
          (child) => `
-- Market ID: ${child.id}
-- Title: ${child.question}
-- Outcomes: ${child.outcomes.join(', ')}
-- Outcome Prices: ${child.outcomePrices.join(', ')}
-- Volume: ${child.volume}
`
        )
        .join('')
    : 'None'
}
------------------`.trim();
}

export function formatPrompt(
  currentMarkets: ParentMarket[],
  previousMarkets: ParentMarket[],
  latestReport: string | null
): string {
  return `
### Latest Report ###
${latestReport || 'No previous report available.'}

### Previous Market Data ###
${previousMarkets.map(formatMarketForPrompt).join('\n')}

### Current Market Data ###
${currentMarkets.map(formatMarketForPrompt).join('\n')}

### Task ###
Provide a detailed analysis of the current market data compared to the previous market data.

Focus on:
1. Markets with the **highest volume and liquidity**.
2. **Major assets**, such as Bitcoin, Ethereum, and Solana, while including other prominent assets.

**Output Format**:

Date: ${new Date().toISOString()}

### Assets ###
- **[Asset Name]**
- **Long-term:** [Analysis with probabilities and trends from previous data].
- **Mid-term:** [Analysis with probabilities and trends from previous data].
- **Short-term:** [Analysis with probabilities and trends from previous data].

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

2. **Trends**:
- Compare probabilities with previous data and highlight changes (e.g., "up from 30% to 40%" or "trend unchanged").

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
}
