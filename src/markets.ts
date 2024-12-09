import { request } from 'undici';
import { config } from './config.js';
import { ApiParentMarket, StreamlinedParentMarket } from './types.js';

// Convert an API parent market object to a streamlined parent market object
export const toStreamlinedMarket = (apiResponse: ApiParentMarket): StreamlinedParentMarket => {
    return {
        id: apiResponse.id,
        title: apiResponse.title,
        startDate: apiResponse.startDate,
        endDate: apiResponse.endDate,
        active: apiResponse.active,
        closed: apiResponse.closed,
        liquidity: apiResponse.liquidity,
        volume: apiResponse.volume,
        //   Probably redundant fields:
        //   description: apiResponse.description,
        //   ticker: apiResponse.ticker,
        //   slug: apiResponse.slug,
        //   image: apiResponse.image,
        //   icon: apiResponse.icon,
        //   featured: apiResponse.featured,
        //   volume24hr: apiResponse.volume24hr,
        //   createdAt: apiResponse.createdAt,
        //   updatedAt: apiResponse.updatedAt,
        childMarkets: apiResponse.markets.map((market) => ({
            id: market.id,
            question: market.question,
            outcomes: JSON.parse(market.outcomes),
            outcomePrices: JSON.parse(market.outcomePrices),
            volume: parseFloat(market.volume),
            active: market.active,
            closed: market.closed,
            //  Probably redundant fields:
            // conditionId: market.conditionId,
            // slug: market.slug,
            // description: market.description,
            // liquidity: parseFloat(market.liquidity || "0"),
            // createdAt: market.createdAt,
            // updatedAt: market.updatedAt,
        })),
    };
};

export async function fetchCryptoMarkets(): Promise<StreamlinedParentMarket[]> {
    const queryParams = new URLSearchParams({
        active: 'true',
        archived: 'false',
        closed: 'false',
        tag_slug: "crypto",
        order: 'volume24hr',
        ascending: 'false',
        limit: '100',
    }).toString();

    const url = `${config.GAMMA_API_URL}?${queryParams}`;

    try {
        // Fetch and parse the response
        const response = await request(url);

        if (response.statusCode !== 200) {
            throw new Error(`API request failed with status code ${response.statusCode}`);
        }

        const responseBody = await response.body.text();
        let data: ApiParentMarket[];

        try {
            data = JSON.parse(responseBody) as ApiParentMarket[];
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            throw new Error('Failed to parse API response as JSON');
        }

        // Validate the structure of the array
        if (!Array.isArray(data)) {
            throw new Error('Invalid API response format: Expected an array');
        }

        // Return the markets array
        return data.map(toStreamlinedMarket);
    } catch (error) {
        // Handle both Error and non-Error exceptions
        if (error instanceof Error) {
            console.error('Error fetching crypto markets:', error.message);
        } else {
            console.error('Error fetching crypto markets:', String(error));
        }
        throw error;
    }
}
