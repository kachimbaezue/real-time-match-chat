import OpenAI from 'openai';
import { env } from '../config/env';
import { MatchState } from '../types';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export class AIService {
  /**
   * Generates a "Match Pulse" - a concise narrative of the current match momentum.
   * Max 3 short paragraphs. No markdown.
   */
  static async generateMatchPulse(matchState: MatchState): Promise<string> {
    try {
      const prompt = `
You are a live football commentator providing a "Match Pulse" update.
Current Match: ${matchState.homeTeam} ${matchState.score.home} - ${matchState.score.away} ${matchState.awayTeam} (Minute: ${matchState.minute})
Momentum: ${matchState.momentum.state}
Possession: ${matchState.stats.possession.home}% - ${matchState.stats.possession.away}%
Recent events count: ${matchState.timeline.slice(-5).length}

Write a concise narrative of the current match momentum.
Requirements:
- Maximum 3 short paragraphs.
- Never invent facts. Base statements on the provided data.
- Natural language.
- No markdown.
`;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].message?.content?.trim() || 'Awaiting match pulse...';
    } catch (error: any) {
      logger.error('Error generating Match Pulse', { error: error.message });
      return 'Unable to generate match pulse at this moment.';
    }
  }

  /**
   * Generates "If You Joined Now" - an instant recap of the match.
   * Keep under 120 words. Should read like a commentator summarizing the match.
   */
  static async generateMatchRecap(matchState: MatchState): Promise<string> {
    try {
      const timelineSummary = matchState.timeline
        .filter(e => ['GOAL', 'RED_CARD', 'PENALTY'].includes(e.type))
        .map(e => `Min ${e.minute}: ${e.type} by ${e.team}`)
        .join(', ');

      const prompt = `
You are a live football commentator summarizing the match for someone who just joined.
Match: ${matchState.homeTeam} ${matchState.score.home} - ${matchState.score.away} ${matchState.awayTeam} (Minute: ${matchState.minute})
Key Events: ${timelineSummary || 'No major events yet.'}
Stats: Shots (${matchState.stats.shots.home} - ${matchState.stats.shots.away})

Generate an instant recap.
Requirements:
- Reads like a commentator summarizing the match.
- Keep under 120 words.
- Never invent facts.
- No markdown.
`;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].message?.content?.trim() || 'Awaiting match recap...';
    } catch (error: any) {
      logger.error('Error generating Match Recap', { error: error.message });
      return 'Unable to generate recap at this moment.';
    }
  }
}
