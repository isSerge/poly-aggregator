import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config.js';
import { NetworkError } from '../errors.js';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  apiKey: config.GEMINI_API_KEY,
});

export async function analyzePredictionMarkets(prompt: string) {
  try {
    return await llm.invoke(prompt);
  } catch (error) {
    throw NetworkError.from(error, 'LLM API request failed');
  }
}
