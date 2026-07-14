import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  // TxLINE guest JWT (from /auth/guest/start) — required to call the API
  TXLINE_JWT: z.string().min(1, 'TXLINE_JWT is required'),
  // TxLINE activated API token — required once you complete the on-chain subscription
  TXLINE_API_KEY: z.string().default(''),
  TXLINE_BASE_URL: z.string().url().default('https://txline.txodds.com'),
  // World Cup competition ID on TxLINE — leave empty to fetch all competitions
  TXLINE_WC_COMPETITION_ID: z.string().default(''),
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

// Warn (don't crash) if the API key is missing — the server can still start
// but TxLINE calls will 401 until the subscription is activated.
if (!env.TXLINE_API_KEY) {
  console.warn('⚠️  TXLINE_API_KEY is not set. TxLINE requests will fail until the on-chain subscription is activated.');
}
