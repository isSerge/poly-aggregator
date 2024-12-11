import { request } from 'undici';
import { config } from './config.js';
import {
  ApiParentMarket,
  ParentMarket,
  isApiParentMarketArray,
} from './types.js';
import { safeJSONParse, handleError } from './utils.js';

// Convert an API parent market object to a streamlined parent market object
export const toStreamlinedMarket = (
  apiResponse: ApiParentMarket
): ParentMarket => {
  return {
    id: apiResponse.id,
    title: apiResponse.title,
    startDate: apiResponse.startDate,
    endDate: apiResponse.endDate,
    active: apiResponse.active,
    closed: apiResponse.closed,
    liquidity: apiResponse.liquidity,
    volume: apiResponse.volume,
    childMarkets: apiResponse.markets
      .filter((market) => !market.closed)
      .map((market) => ({
        id: market.id,
        question: market.question,
        outcomes: safeJSONParse<string[]>(market.outcomes) || [],
        outcomePrices: safeJSONParse<string[]>(market.outcomePrices) || [],
        volume: parseFloat(market.volume),
        active: market.active,
        closed: market.closed,
      })),
  };
};

export async function fetchCryptoMarkets(): Promise<ParentMarket[]> {
  const queryParams = new URLSearchParams({
    active: 'true',
    archived: 'false',
    closed: 'false',
    tag_slug: 'crypto',
    order: 'volume24hr',
    ascending: 'false',
    limit: '100',
  }).toString();

  const url = `${config.GAMMA_API_URL}?${queryParams}`;

  try {
    const response = await request(url);
    if (response.statusCode !== 200) {
      throw new Error(
        `API request failed with status code ${response.statusCode}`
      );
    }

    const responseBody = await response.body.text();
    const data = safeJSONParse<ApiParentMarket[]>(responseBody);

    // Handle the case where data is null
    if (!data) {
      throw new Error('Failed to parse API response: data is null');
    }

    if (!isApiParentMarketArray(data)) {
      throw new Error(
        'Invalid API response format: Expected an array of ApiParentMarket'
      );
    }

    return data.map(toStreamlinedMarket);
  } catch (error) {
    handleError(error, 'Error fetching crypto markets');
    throw error; // Rethrow to maintain original error handling
  }
}
