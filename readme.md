# Poly Aggregator

Poly Aggregator is a comprehensive market analysis tool for monitoring prediction markets. It fetches, processes, and analyzes data from Polymarket, generates insightful reports, and broadcasts them to Telegram subscribers.

## Features

- **Market Data Fetching**: Fetches active prediction markets from Polymarket.
- **Market Analysis**: Filters and scores markets based on volume, liquidity, and other metrics.
- **AI-Powered Insights**: Uses Google's Gemini LLM to generate detailed market reports.
- **Report Management**: Saves and retrieves reports from a local SQLite database.
- **Telegram Bot Integration**: Notifies subscribers with the latest market analysis.
- **Automation**: Supports scheduled market analysis using a cron job.

---

## Project Structure

```
src
├── main.ts                # Main entry point for market analysis
├── index.ts               # Application startup and initialization
├── config.ts              # Environment configuration
├── coinmarketcap/         # Coinmarketcap API integration
│   ├── coinmarketcap.ts   # Fetch current prices for majors
├── db/                    # Database management
│   ├── db.ts              # SQLite connection and management
│   ├── schema.sql         # Database schema
│   └── types.ts           # Helper types for database operations
├── logger.ts              # Pino-based logging setup
├── markets/               # Market-specific logic
│   ├── markets.ts         # Market repository for saving/retrieving data
│   ├── market-filter.ts   # Market filtering and scoring logic
│   └── markets-schemas.ts # Market schemas for validation
├── polymarket/            # Polymarket integration
│   ├── polymarket.ts      # API interaction and data transformation
│   └── polymarket-schemas.ts # API schemas for validation
├── reports/               # Report generation and management
│   ├── prompt.ts          # Prompt formatting for AI analysis
│   ├── reports.ts         # Report repository for managing reports
│   └── llm.ts             # Google Gemini LLM integration
├── telegram/              # Telegram bot integration
│   ├── subscribers.ts     # Subscriber management
│   └── telegram.ts        # Telegram bot service
├── errors.ts              # Custom error types
├── test/                  # Unit tests
└── testPrompt.ts          # CLI script to generate a sample prompt
```

---

## Setup

### Prerequisites

- Node.js >= 16
- SQLite3
- Telegram Bot API Token
- Polymarket API access
- Google Gemini API access

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/isserge/poly-aggregator.git
   cd poly-aggregator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:
   ```env
   GAMMA_API_URL=https://api.polymarket.com
   TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
   GEMINI_API_KEY=<your_gemini_api_key>
   DB_PATH=./data/database.db
   CRON_SCHEDULE=0 */12 * * * # Every 12 hours
   COINMARKETCAP_API_KEY=<your_coinmarketcap_api_key>
   ```

---

## Usage

### Start the Application

```bash
npm start
```

This will initialize the database, start the Telegram bot, and schedule market analysis.

### Start local development

```bash
npm run dev
```

---

## Features in Detail

### Market Filtering

- Filters markets based on volume, liquidity, and asset-specific scoring.
- Time-weighted prioritization of recent markets.

### AI Analysis

- Integrates with Google Gemini LLM to generate actionable insights.
- Generates prompts with structured market data and trends.

### Telegram Bot

- Commands:
  - `/start`: Subscribe to market updates.
  - `/stop`: Unsubscribe from updates.
- Automatically broadcasts analysis reports to subscribers.

---

## Testing

Run all unit tests:

```bash
npm test
```

Individual test files are located in the `src/test/` directory and cover major modules like database operations, market filtering, and Telegram bot functionality.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
