import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly tell dotenv where the .env file is (in backend directory)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3001'),
  // TxLINE guest JWT (from /auth/guest/start) — required to call the API
  TXLINE_JWT: z.string().optional().default(''),
  // TxLINE activated API token — required once you complete the on-chain subscription
  TXLINE_API_KEY: z.string().default(''),
  TXLINE_BASE_URL: z.string().url().default('https://txline.txodds.com'),
  // World Cup competition ID on TxLINE — leave empty to fetch all competitions
  TXLINE_WC_COMPETITION_ID: z.string().default(''),
  // News API key for fetching verified World Cup news
  NEWS_API_KEY: z.string().optional().default(''),
  // AI keys — GROQ_API_KEY is free (https://console.groq.com), OpenAI is fallback
  GROQ_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;

export function hasTxLineCredentials(): boolean {
  return Boolean(env.TXLINE_JWT && env.TXLINE_API_KEY);
}

// Warn (don't crash) if the API key is missing — the server can still start
// but TxLINE calls will 401 until the subscription is activated.
if (!env.TXLINE_API_KEY) {
  console.warn('⚠️  TXLINE_API_KEY is not set. TxLINE requests will fail until the on-chain subscription is activated.');
}

if (!env.TXLINE_JWT) {
  console.warn('⚠️  TXLINE_JWT is not set. The backend cannot fetch TxLINE data until it is configured.');
}
