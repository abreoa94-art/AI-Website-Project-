import OpenAI from 'openai';

const referer = process.env.APP_URL ?? 'http://localhost:5173';
const appTitle = process.env.APP_NAME ?? 'SiteBuilder';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.AI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': referer,
    'X-Title': appTitle,
  },
});

export default openai;