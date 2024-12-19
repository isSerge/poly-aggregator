import { request } from 'undici';
import { config } from '../config.js';
import { ValidationError, NetworkError } from '../errors.js';
import {
  ParentMarket,
  ParentMarketSchema,
} from '../markets/markets-schemas.js';
import {
  ApiParentMarket,
  ApiParentMarketArraySchema,
} from './polymarket-schemas.js';

export function toStreamlinedMarket(
  apiResponse: ApiParentMarket
): ParentMarket {
  // Filter out closed child markets
  const filteredChildMarkets = apiResponse.markets.filter(
    (market) => !market.closed
  );

  // Map to internal ChildMarket type
  const childMarkets = filteredChildMarkets.map((market) => ({
    id: market.id,
    parent_market_id: apiResponse.id,
    question: market.question,
    outcomes: market.outcomes,
    outcomePrices: market.outcomePrices,
    volume: market.volume || 0,
  }));

  // Create the ParentMarket object
  const parentMarket: ParentMarket = {
    id: apiResponse.id,
    title: apiResponse.title,
    startDate: apiResponse.startDate || '', // Some markets may not have a start date
    endDate: apiResponse.endDate ?? null,
    liquidity: apiResponse.liquidity,
    volume: apiResponse.volume || 0,
    childMarkets,
  };

  // Validate the transformed market
  try {
    ParentMarketSchema.parse(parentMarket);
  } catch (error) {
    throw new ValidationError(
      `Invalid market format for market ${apiResponse.id}`,
      [error]
    );
  }

  return parentMarket;
}

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

  let response;
  try {
    response = await request(url);
  } catch (error) {
    throw NetworkError.from(error, 'API request failed');
  }

  if (response.statusCode !== 200) {
    throw new NetworkError('API request failed', response.statusCode);
  }

  const responseBody = await response.body.text();
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(responseBody);
  } catch (error) {
    throw new ValidationError('Invalid JSON response from API', [error]);
  }

  // Validate API response format
  const validationResult = ApiParentMarketArraySchema.safeParse(parsedData);

  if (!validationResult.success) {
    throw new ValidationError(
      'Invalid API response format',
      validationResult.error.errors
    );
  }

  // Transform API markets to internal format
  return validationResult.data.map(toStreamlinedMarket);
}
