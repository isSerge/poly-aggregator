import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config.js';
import { ParentMarket, ChildMarket } from '../markets/markets-schemas.js';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  apiKey: config.GEMINI_API_KEY,
});

/**
 * Format the market data for LLM processing
 * @param {ParentMarket[]} currentMarkets - Array of current market data
 * @param {ParentMarket[]} historicalMarkets - Array of historical market data
 * @param {string | null} latestReport - Latest LLM report
 * @returns {string} - Formatted prompt for the LLM
 */
function formatPrompt(
  currentMarkets: ParentMarket[],
  historicalMarkets: ParentMarket[],
  latestReport: string | null
): string {
  return `
      ### Latest Report ###
      ${latestReport || 'No previous report available.'}

      ### Historical Market Data ###
      ${historicalMarkets
        .map(
          (market: ParentMarket) => `
        - Market ID: ${market.id}
        - Title: ${market.title}
        - Liquidity: ${market.liquidity}
        - Volume: ${market.volume}
        `
        )
        .join('\n')}

      ### Current Market Data ###
      ${currentMarkets
        .map(
          (market: ParentMarket) => `
        - Market ID: ${market.id}
        - Title: ${market.title}
        - Liquidity: ${market.liquidity}
        - Volume: ${market.volume}
        - Child Markets:
        ${market.childMarkets
          ?.map(
            (child: ChildMarket) => `
        * ${child.question}
            - Outcome Prices: ${child.outcomePrices.map((price) => price.toString()).join(', ')}
            - Volume: ${child.volume}
        `
          )
          .join('')}
        `
        )
        .join('\n')}

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
}

/**
 * Analyze trends using OpenAI LLM
 * @param {ParentMarket[]} currentMarkets - Array of current market data
 * @param {ParentMarket[]} historicalMarkets - Array of historical market data
 * @param {string | null} latestReport - Latest LLM report
 * @returns {Promise<string>} - Analysis result
 */
export async function analyzeTrendsWithLLM(
  currentMarkets: ParentMarket[],
  historicalMarkets: ParentMarket[],
  latestReport: string | null
) {
  const prompt = formatPrompt(currentMarkets, historicalMarkets, latestReport);

  const response = await llm.invoke(prompt);

  return response;
}
