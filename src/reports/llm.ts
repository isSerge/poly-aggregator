import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config.js';
import { logger } from '../logger.js';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  apiKey: config.GEMINI_API_KEY,
});

export async function analyzePredictionMarkets(prompt: string) {
  try {
    return await llm.invoke(prompt);
  } catch (error) {
    logger.error(`LLM Invocation Error: ${error}`);
    throw error;
  }
}
