import { request } from 'undici';
import { config } from '../config.js';
import { NetworkError } from '../errors.js';

const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CoinMarketCapResponse {
  data: Record<string, any>;
  status: Record<string, any>;
}

export async function fetchCryptoPrices(symbols: string[]): Promise<string> {
  const queryParams = new URLSearchParams({
    symbol: symbols.join(','),
    convert: 'USD',
  });

  const url = `${COINMARKETCAP_BASE_URL}/cryptocurrency/quotes/latest?${queryParams.toString()}`;

  let response;
  try {
    response = await request(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': config.COINMARKETCAP_API_KEY,
      },
    });
  } catch (error) {
    throw NetworkError.from(error, 'Failed to fetch prices from CoinMarketCap');
  }

  if (response.statusCode !== 200) {
    const errorBody = await response.body.text();
    throw new NetworkError(
      `CoinMarketCap API error: ${response.statusCode} - ${errorBody}`,
      response.statusCode
    );
  }

  const bodyText = await response.body.text();
  const parsedResponse: CoinMarketCapResponse = JSON.parse(bodyText);

  const prices: Record<string, number> = {};
  for (const symbol of symbols) {
    if (parsedResponse.data[symbol]) {
      prices[symbol] = parsedResponse.data[symbol].quote.USD.price;
    }
  }

  return Object.entries(prices)
    .map(([symbol, price]) => `${symbol}: $${price}`)
    .join('\n');
}
