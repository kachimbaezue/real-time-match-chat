import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  TXLINE_API_KEY: z.string().min(1, 'TXLINE_API_KEY is required'),
  TXLINE_BASE_URL: z.string().url().default('https://txline.txodds.com'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
