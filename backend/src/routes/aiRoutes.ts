import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /ai/chat
 * Simple single-turn AI chat for the Moments page.
 * Body: { prompt: string, maxTokens?: number }
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, maxTokens = 150 } = req.body as { prompt?: string; maxTokens?: number };

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    if (!env.GROQ_API_KEY) {
      // No AI key — return a friendly fallback
      res.json({ text: "AI is not configured on this server. Ask me about Messi, Ronaldo, or the biggest upsets!" });
      return;
    }

    const OpenAI = (await import('openai')).default;
    const groq = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.min(maxTokens, 300),
      temperature: 0.6,
    });

    const text = response.choices[0]?.message?.content?.trim() ?? '';
    res.json({ text });
  } catch (err: any) {
    logger.error('AI chat error', err);
    res.status(500).json({ error: 'AI unavailable', text: 'Sorry, I could not answer that right now.' });
  }
});

export default router;
