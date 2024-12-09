import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from './config.js';
import { StreamlinedParentMarket } from './types.js';

const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    apiKey: config.GEMINI_API_KEY,
});

/**
 * Format the market data for LLM processing
 * @param {StreamlinedParentMarket[]} currentMarkets - Array of current market data
 * @param {StreamlinedParentMarket[]} historicalMarkets - Array of historical market data
 * @returns {string} - Formatted prompt for the LLM
 */
function formatPrompt(currentMarkets: StreamlinedParentMarket[], historicalMarkets: StreamlinedParentMarket[]): string {
    return `
        ### Current Market Data ###
        ${currentMarkets.map((market: any) => `
        - Market ID: ${market.id}
        - Title: ${market.title}
        - Liquidity: ${market.liquidity}
        - Volume: ${market.volume}
        - Child Markets:
        ${market.childMarkets?.map((child: any) => `
        * ${child.question}
            - Outcome Prices: ${child.outcomePrices.join(', ')}
            - Volume: ${child.volume}
        `).join('')}
        `).join('\n')}

        ### Historical Market Data ###
        ${historicalMarkets.map((market: any) => `
        - Market ID: ${market.id}
        - Title: ${market.title}
        - Liquidity: ${market.liquidity}
        - Volume: ${market.volume}
        `).join('\n')}

        ### Task ###
        Compare the current market data to the historical market data and describe trends. 
        Highlight significant changes in liquidity, volume, or outcome probabilities for child markets. 
        Summarize your analysis and provide points of interest that might be useful for investors.
        Group observations by asset or market type and provide insights into potential market movements.
        Do not provide any disclaimers and description of what this analysis is for.
    `;
}

/**
 * Analyze trends using OpenAI LLM
 * @param {StreamlinedParentMarket[]} currentMarkets - Array of current market data
 * @param {StreamlinedParentMarket[]} historicalMarkets - Array of historical market data
 * @returns {Promise<string>} - Analysis result
 */
export async function analyzeTrendsWithLLM(currentMarkets: StreamlinedParentMarket[], historicalMarkets: StreamlinedParentMarket[]) {
    const prompt = formatPrompt(currentMarkets, historicalMarkets);

    const response = await llm.invoke(prompt);

    return response
}
