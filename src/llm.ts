import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from './config.js';
import { StreamlinedParentMarket, StreamlinedChildMarket } from './types.js';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  apiKey: config.GEMINI_API_KEY,
});

/**
 * Format the market data for LLM processing
 * @param {StreamlinedParentMarket[]} currentMarkets - Array of current market data
 * @param {StreamlinedParentMarket[]} historicalMarkets - Array of historical market data
 * @param {string | null} latestReport - Latest LLM report
 * @returns {string} - Formatted prompt for the LLM
 */
function formatPrompt(
  currentMarkets: StreamlinedParentMarket[],
  historicalMarkets: StreamlinedParentMarket[],
  latestReport: string | null
): string {
  return `
        ### Previous Report ###
        ${latestReport || 'No previous report found'}

        ### Historical Market Data ###
        ${historicalMarkets
          .map(
            (market: StreamlinedParentMarket) => `
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
            (market: StreamlinedParentMarket) => `
        - Market ID: ${market.id}
        - Title: ${market.title}
        - Liquidity: ${market.liquidity}
        - Volume: ${market.volume}
        - Child Markets:
        ${market.childMarkets
          ?.map(
            (child: StreamlinedChildMarket) => `
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
        Provide analysis on the current market data compared to the historical market data.
        Focus on the markets with most volume and liquidity. Make sure to include Bitcoin, Ethereum, Solana and other major assets.
        Indicate range of price movements, potential outcomes as well as most like price.
        Include any noticable trends or patterns in the data that could be useful.
        Use following format:
        ### Assets ###
        Asset name: [asset name]
        Long-term outlook: [outlook]
        Mid-term outlook: [outlook]
        Short-term outlook: [outlook]

        ### Additional Insights ###
        Airdrops: 
        [list of airdrops with assets and probabilities]
        Events: 
        [list of regulatory or any significant events and probabilities]
        Listings: 
        [list of coin listings and probabilities]

        For aidrops, events, and listings only include markets with high volume and liquidity.
        When indicating probabilities, always provide numerical values and specify trend by comparing with previous values.
        Do not include preamble, jump straight into the insights.
        Do not include market IDs or other technical details, focus on the analysis.
        Do not include any not financial advice disclaimers or notes about risks.
    `;
}

/**
 * Analyze trends using OpenAI LLM
 * @param {StreamlinedParentMarket[]} currentMarkets - Array of current market data
 * @param {StreamlinedParentMarket[]} historicalMarkets - Array of historical market data
 * @param {string | null} latestReport - Latest LLM report
 * @returns {Promise<string>} - Analysis result
 */
export async function analyzeTrendsWithLLM(
  currentMarkets: StreamlinedParentMarket[],
  historicalMarkets: StreamlinedParentMarket[],
  latestReport: string | null
) {
  const prompt = formatPrompt(currentMarkets, historicalMarkets, latestReport);

  const response = await llm.invoke(prompt);

  return response;
}
