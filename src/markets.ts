import { request } from 'undici';
import { config } from './config.js';
import {
  ApiParentMarket,
  ParentMarket,
  ApiParentMarketArraySchema,
  ParentMarketSchema,
} from './types.js';
import { handleError } from './utils.js';

export const toStreamlinedMarket = (
  apiResponse: ApiParentMarket
): ParentMarket => {
  // Using Zod's transform capabilities, the fields are already parsed and transformed.
  // Therefore, we can directly map the fields without manual parsing.

  // Filter out closed child markets
  const filteredChildMarkets = apiResponse.markets.filter(
    (market) => !market.closed
  );

  // Map to internal ChildMarket type
  const childMarkets = filteredChildMarkets.map((market) => ({
    id: market.id,
    question: market.question,
    outcomes: market.outcomes, // Already string[]
    outcomePrices: market.outcomePrices, // Already string[]
    volume: market.volume, // Already number
    active: market.active,
    closed: market.closed,
  }));

  // Create the ParentMarket object
  const parentMarket: ParentMarket = {
    id: apiResponse.id,
    title: apiResponse.title,
    startDate: apiResponse.startDate,
    endDate: apiResponse.endDate,
    active: apiResponse.active,
    closed: apiResponse.closed,
    liquidity: apiResponse.liquidity,
    volume: apiResponse.volume,
    childMarkets,
  };

  ParentMarketSchema.parse(parentMarket);

  return parentMarket;
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

    // Parse the JSON response
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(responseBody);
    } catch {
      throw new Error('Failed to parse JSON response from API');
    }

    // Validate and transform the data using Zod
    const validationResult = ApiParentMarketArraySchema.safeParse(parsedData);

    if (!validationResult.success) {
      // Extract and format Zod validation errors for better debugging
      const formattedErrors = validationResult.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(
        `API response validation failed: ${JSON.stringify(formattedErrors)}`
      );
    }

    const apiParentMarkets = validationResult.data;

    // Transform API parent markets to internal ParentMarket types
    const parentMarkets: ParentMarket[] =
      apiParentMarkets.map(toStreamlinedMarket);

    return parentMarkets;
  } catch (error) {
    handleError(error, 'Error fetching crypto markets');
    throw error; // Rethrow to maintain original error handling
  }
}
