import { ParentMarket } from '../markets/markets-schemas.js';
import { FilterResult } from '../markets/market-filter.js';

export function formatPrompt(
  currentMarkets: FilterResult,
  previousMarkets: FilterResult,
  currentPrices: string | null,
  latestReport: string | null
): string {
  const now = new Date();
  const timestamp = now.toISOString();

  return `
TIMESTAMP: ${timestamp}

## 1. Introduction & Segmentation
1. **Give a Short Overview**  
   - Summarize the overall market mood in 1–2 sentences (e.g., “Markets are cautiously bullish…”).
2. **Organize by Asset**  
   - Create sections for BTC, ETH, SOL, etc.  
   - Optionally include small-cap assets only if they show significant changes.
**Example**:
“The overall crypto market shows steady growth, with BTC and ETH volume ticking up slightly. We’ll focus on a few key price targets and notable events…”

---

## 2. Granular Volume & Liquidity

### Pick Only Key Targets
- Identify 2–3 price targets/markets per major asset that show notable volume, liquidity, or odds changes.  
- Avoid listing every single available target if they’re not showing significant activity.

### Present Volume & Liquidity with Emojis
- Use ⬆️ for increases, ⬇️ for decreases, and ➡️ for minimal change.  
- **Example**:
**BTC @ $110K**
- Volume: $6.23M (⬆️ from $6.20M)
- Liquidity: High (⬆️ vs. last report)
  
---

## 3. Price Predictions & Odds
1.	Include Yes-Price Probability
  •	Show the current probability (e.g., 18%) and how it changed (⬇️ from 20%).
2.	Brief Explanation
  •	In 1–2 sentences, explain what a higher or lower probability suggests about market sentiment.

Example:
**BTC @ $110K**
- Volume: $6.23M (⬆️)
- Liquidity: $1.06M (⬆️)
- Odds (Yes): 18% (⬇️ from 20%)

---

## 4. Notable Events (Non-Price)
1. Cover Airdrops, Listings, Protocol Updates, etc.
	•	Include event probabilities or “Yes”-prices (e.g., 0.7% for a MetaMask airdrop).
2. No Price Duplication
	•	If the event is “BTC to $110K,” or "Will asset reach All-time-high" it belongs under Price Predictions, not here.

Example:
**Notable Events**
1. MetaMask Airdrop in 2024
   - Odds (Yes): 0.7% (⬇️ from 1.1%)
2. USDC > USDT Market Cap
   - Odds (Yes): 0.85% (⬆️ from 0.8%)

---

## 5. Overall Market Trends
1. Summarize Cross-Asset Sentiment
  •	Combine your observations on volume, liquidity, and odds in a short paragraph.
2. Highlight Correlations/Divergences
  •	E.g., “BTC and ETH liquidity rose together, while SOL volume was flat.”

Example:
“Overall, BTC and ETH maintain moderate gains in both volume and liquidity, suggesting a continued bullish bias, while SOL’s liquidity outpacing its volume may indicate potential volatility ahead.”

---

## 6. Actionable Insights
1.	2–3 Tips or Observations
	•	These must stem from the data changes.
	•	Use emojis to hint at direction or magnitude (e.g., ⬆️ SOL liquidity).
2.	Reference the Data
	•	E.g., “BTC’s volume at $110K jumped from $6.20M to $6.23M (⬆️), indicating growing confidence.”

Example:
**Actionable Insights**
1. ⬆️ BTC’s volume near $110K suggests continued bullish momentum; consider short-term momentum plays.
2. SOL’s liquidity surge could mean sharper price moves if buying spikes—watch for sudden volume jumps.
3. ETH’s $4,500 odds remain low (6.5%), but robust liquidity implies rapid upside potential on unexpected catalysts.

---

### Final Format Example:
1. Introduction
   - Brief overview of the market

2. Bitcoin (BTC)
   - Select targets (e.g., $90K, $110K, $130K)
   - Volume, Liquidity, Odds (Yes)
   - Short implications

3. Ethereum (ETH)
   - Select targets (e.g., $4,200, $4,500, $5,000)
   - Volume, Liquidity, Odds (Yes)
   - Short implications

4. Solana (SOL)
   - Select target(s) if relevant
   - Volume, Liquidity, Odds (Yes)
   - Short implications

5. Notable Events
   - Non-price events (airdrops, listings, FTX payouts, market cap flips)
   - Odds (Yes) with emojis
   - No overlap with price targets

6. Overall Market Trends
   - One paragraph summarizing cross-asset behavior

7. Actionable Insights
   - 2–3 data-driven tips or takeaways
   - Use ⬆️, ⬇️, ➡️ where relevant

---

Do not include any notes.

REFERENCE DATA:
${
  currentPrices &&
  `CURRENT PRICES:
${currentPrices}`
}

CURRENT MARKET DATA:
${currentMarkets.markets.map(formatMarketForPrompt).join('\n')}

PREVIOUS MARKET DATA:
${previousMarkets.markets.map(formatMarketForPrompt).join('\n')}

LATEST REPORT:
${latestReport || 'No previous report available'}
`;
}

export function formatMarketForPrompt(market: ParentMarket): string {
  return `
MARKET-ID: ${market.id}
TITLE: ${market.title}
VOL: $${formatNumber(market.volume)}
LIQ: $${formatNumber(market.liquidity)}
CHILDREN:
${
  market.childMarkets.length > 0
    ? market.childMarkets
        .map(
          (child) => `
ID: ${child.id}
Q: ${child.question}
OUTCOMES: ${child.outcomes.join(' / ')}
PRICES: ${child.outcomePrices.join(' / ')}
VOL: $${formatNumber(child.volume)}
`
        )
        .join('')
    : 'None'
}
---`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(num);
}
