export interface StreamlinedParentMarket {
  id: string;                            // Unique identifier for tracking
  title: string;                         // Market title/question
  startDate: string | null;              // ISO string (optional)
  endDate: string | null;                // ISO string (optional)
  active: boolean;                       // Active status
  closed: boolean;                       // Closed status
  liquidity: number;                     // Total liquidity
  volume: number;                        // Total volume
  childMarkets: StreamlinedChildMarket[]; // Array of child markets
}

export interface StreamlinedChildMarket {
  id: string;                            // Unique identifier for tracking
  question: string;                      // Market-specific question
  outcomes: string[];                    // Parsed outcomes array
  outcomePrices: number[];               // Parsed outcome prices
  volume: number;                        // Volume in numeric format
}


export interface ApiParentMarket {
  id: string;                      // Unique identifier for the parent market
  ticker: string;                  // Market ticker
  slug: string;                    // Slug for the market
  title: string;                   // Market title or question
  description: string;             // Market description
  resolutionSource: string;        // Resolution source, if any
  startDate: string;               // Start date of the parent market (ISO string)
  creationDate: string;            // Creation date of the parent market (ISO string)
  endDate: string;                 // End date of the parent market (ISO string)
  image: string;                   // URL for the market's image
  icon: string;                    // URL for the market's icon
  active: boolean;                 // Indicates if the market is active
  closed: boolean;                 // Indicates if the market is closed
  archived: boolean;               // Indicates if the market is archived
  featured: boolean;               // Indicates if the market is featured
  restricted: boolean;             // Indicates if the market is restricted
  liquidity: number;               // Total liquidity of the parent market
  volume: number;                  // Total volume of the parent market
  openInterest: number;            // Open interest in the parent market
  createdAt: string;               // Creation timestamp of the parent market
  updatedAt: string;               // Last update timestamp of the parent market
  volume24hr: number;              // Volume of the parent market in the last 24 hours
  enableOrderBook: boolean;        // Indicates if order book is enabled
  markets: ApiChildMarket[];       // Array of associated child markets
  tags: ApiTag[];                  // Array of tags associated with the market
}

export interface ApiChildMarket {
  id: string;                      // Unique identifier for the child market
  question: string;                // Question or title of the child market
  conditionId: string;             // Condition ID for the child market
  slug: string;                    // Slug for the child market
  resolutionSource: string;        // Resolution source, if any
  endDate: string;                 // End date of the child market (ISO string)
  startDate: string;               // Start date of the child market (ISO string)
  image: string;                   // URL for the child market's image
  icon: string;                    // URL for the child market's icon
  description: string;             // Description of the child market
  outcomes: string;                // JSON string of possible outcomes (e.g., '["Yes", "No"]')
  outcomePrices: string;           // JSON string of outcome prices (e.g., '["1", "0"]')
  volume: string;                  // Volume as a string, needs parsing
  active: boolean;                 // Indicates if the child market is active
  closed: boolean;                 // Indicates if the child market is closed
  createdAt: string;               // Creation timestamp of the child market
  updatedAt: string;               // Last update timestamp of the child market
  liquidity: string;               // Liquidity as a string, needs parsing
}

export interface ApiTag {
  id: string;                      // Tag ID
  label: string;                   // Tag label
  slug: string;                    // Slug for the tag
  forceShow: boolean;              // Indicates if the tag is forced to be shown
  publishedAt: string;             // Publish timestamp
  createdAt: string;               // Creation timestamp
  updatedAt: string;               // Last update timestamp
}

export const isApiParentMarketArray = (data: any): data is ApiParentMarket[] => {
    return Array.isArray(data) && data.every(item => 'id' in item && 'title' in item); // Add more checks as needed
};

