import OpenAI from 'openai';
import { env } from '../config/env';
import { MatchState } from '../types';
import { logger } from '../utils/logger';

/**
 * AI Service — uses Groq (free, fast) as primary provider.
 * Falls back to OpenAI gpt-4o-mini if OPENAI_API_KEY is set.
 * Falls back to rule-based generation if neither key is available.
 *
 * Set GROQ_API_KEY in backend/.env for free AI.
 * Get a free key at: https://console.groq.com
 */

// Groq client (OpenAI-compatible API, free tier)
const groq = env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

// OpenAI client (fallback)
const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const client = groq ?? openai;
const MODEL = groq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

async function chat(prompt: string, maxTokens: number): Promise<string> {
  if (!client) return '';
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.6,
  });
  return response.choices[0].message?.content?.trim() ?? '';
}

export class AIService {
  /**
   * Match Pulse — 1-3 sentence narrative of the current state of play.
   * For live matches: concise, present-tense, ~120 tokens.
   * For finished matches: richer multi-section story, ~300 tokens.
   */
  static async generateMatchPulse(match: MatchState): Promise<string> {
    if (!client) return AIService.ruleBasedPulse(match);

    const isFinished = match.status === 'FINISHED';

    try {
      const recentEvents = match.timeline
        .slice(0, 8)
        .map((e) => `${e.minute}' ${e.title}${e.player ? ` (${e.player})` : ''}`)
        .join(', ');

      const homeStarters = match.lineups?.home.filter(p => p.starter).map(p => p.shortName).join(', ');
      const awayStarters = match.lineups?.away.filter(p => p.starter).map(p => p.shortName).join(', ');

      if (isFinished) {
        const keyEvents = match.timeline
          .filter((e) => ['GOAL', 'RED_CARD', 'PENALTY'].includes(e.type))
          .sort((a, b) => a.minute - b.minute)
          .map((e) => `${e.minute}': ${e.title}${e.player ? ` (${e.player})` : ''} — ${e.team === 'HOME' ? match.homeTeam : match.awayTeam}`)
          .join('; ');

        const winner = match.score.home > match.score.away ? match.homeTeam
          : match.score.away > match.score.home ? match.awayTeam : 'neither team';

        const prompt = `You are a football journalist writing a post-match report for a live football app.

Match: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam} (FINAL)
Competition: ${match.competition}
Winner: ${winner}
Key events: ${keyEvents || 'No major events recorded.'}
Shots: ${match.homeTeam} ${match.stats.shots.home} (${match.stats.shotsOnTarget.home} on target) — ${match.awayTeam} ${match.stats.shots.away} (${match.stats.shotsOnTarget.away} on target)
Corners: ${match.stats.corners.home} — ${match.stats.corners.away}
Yellow cards: ${match.stats.yellowCards.home} — ${match.stats.yellowCards.away}${homeStarters ? `\n${match.homeTeam} XI: ${homeStarters}` : ''}${awayStarters ? `\n${match.awayTeam} XI: ${awayStarters}` : ''}

Write a vivid 3-paragraph match report. Paragraph 1: what happened (result + how it unfolded). Paragraph 2: the decisive moment or key player. Paragraph 3: what this result means. Each paragraph 2-3 sentences. No markdown, no headers, no bullet points. Separate paragraphs with a blank line.`;

        return await chat(prompt, 350);
      } else {
        const prompt = `You are a football match analyst writing a "Match Pulse" — a concise, factual summary of the current state of play for a live app.

Match: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam}
Minute: ${match.minute}'
Status: ${match.status}
Momentum: ${match.momentum.state} (score: ${match.momentum.score}/100, positive = home team)
Possession: ${match.homeTeam} ${match.stats.possession.home}% — ${match.awayTeam} ${match.stats.possession.away}%
Shots: ${match.homeTeam} ${match.stats.shots.home} (${match.stats.shotsOnTarget.home} on target) — ${match.awayTeam} ${match.stats.shots.away} (${match.stats.shotsOnTarget.away} on target)
Corners: ${match.stats.corners.home} — ${match.stats.corners.away}
Recent events: ${recentEvents || 'None yet'}${homeStarters ? `\n${match.homeTeam} key players: ${homeStarters}` : ''}${awayStarters ? `\n${match.awayTeam} key players: ${awayStarters}` : ''}

Write exactly 2-3 sentences. Factual, present tense, no markdown, no invented information. Focus on what is most significant right now.`;

        return await chat(prompt, 150);
      }
    } catch (err: any) {
      logger.error('AI generateMatchPulse failed', { error: err.message });
      return AIService.ruleBasedPulse(match);
    }
  }

  /**
   * "If You Joined Now" recap — catch-up summary under 100 words.
   */
  static async generateMatchRecap(match: MatchState): Promise<string> {
    if (!client) return AIService.ruleBasedRecap(match);

    try {
      const keyEvents = match.timeline
        .filter((e) => ['GOAL', 'RED_CARD', 'PENALTY'].includes(e.type))
        .map((e) => `${e.minute}': ${e.title}${e.player ? ` – ${e.player}` : ''} (${e.team === 'HOME' ? match.homeTeam : match.awayTeam})`)
        .join('; ');

      const prompt = `You are a football commentator. A viewer just tuned into this match. Write them a quick catch-up.

Match: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam} (${match.minute}')
Key events: ${keyEvents || 'No major events yet.'}
Shots: ${match.homeTeam} ${match.stats.shots.home} — ${match.awayTeam} ${match.stats.shots.away}
Possession: ${match.homeTeam} ${match.stats.possession.home}% — ${match.awayTeam} ${match.stats.possession.away}%

Write under 100 words. No bullet points or markdown. Factual only. Tell them the story of the match so far.`;

      return await chat(prompt, 150);
    } catch (err: any) {
      logger.error('AI generateMatchRecap failed', { error: err.message });
      return AIService.ruleBasedRecap(match);
    }
  }

  /**
   * Win probability — returns { home, draw, away } percentages that sum to 100.
   * Combines statistical model with AI reasoning for live matches.
   * For finished matches, sets the winner to ~95%.
   */
  static calculateWinProbability(match: MatchState): { home: number; draw: number; away: number } {
    // Finished match — reflect the result
    if (match.status === 'FINISHED') {
      if (match.score.home > match.score.away) return { home: 93, draw: 5, away: 2 };
      if (match.score.away > match.score.home) return { home: 2, draw: 5, away: 93 };
      return { home: 10, draw: 80, away: 10 }; // draw
    }

    // Not started — equal probability
    if (match.status === 'NOT_STARTED') return { home: 40, draw: 25, away: 35 };

    // Live match — statistical model
    let homeAdv = 0;

    // Score differential is the biggest factor
    const scoreDiff = match.score.home - match.score.away;
    homeAdv += scoreDiff * 22;

    // Momentum
    homeAdv += match.momentum.score * 0.18;

    // xG differential
    const xgDiff = match.stats.expectedGoals.home - match.stats.expectedGoals.away;
    homeAdv += xgDiff * 8;

    // Shots on target
    const sotDiff = match.stats.shotsOnTarget.home - match.stats.shotsOnTarget.away;
    homeAdv += sotDiff * 2;

    // Time remaining factor — leads are more secure late in the game
    const minuteWeight = Math.min(match.minute / 90, 1);
    homeAdv *= (0.5 + 0.5 * minuteWeight);

    // Red card penalty
    const homeReds = match.timeline.filter(e => e.type === 'RED_CARD' && e.team === 'HOME').length;
    const awayReds = match.timeline.filter(e => e.type === 'RED_CARD' && e.team === 'AWAY').length;
    homeAdv -= homeReds * 20;
    homeAdv += awayReds * 20;

    // Base probabilities centered around 40/25/35 (slight home advantage)
    let home = 40 + homeAdv;
    let away = 35 - homeAdv;
    let draw = 25;

    // Clamp
    home = Math.max(2, Math.min(95, home));
    away = Math.max(2, Math.min(95, away));
    draw = Math.max(2, Math.min(50, draw));

    // Normalize to 100
    const total = home + draw + away;
    home = Math.round((home / total) * 100);
    away = Math.round((away / total) * 100);
    draw = 100 - home - away;

    return { home, draw, away };
  }

  /**
   * Turning points for finished matches.
   */
  static async generateTurningPoints(match: MatchState): Promise<string[]> {
    if (!client) return AIService.ruleBasedTurningPoints(match);

    try {
      const events = match.timeline
        .filter((e) => ['GOAL', 'RED_CARD', 'PENALTY'].includes(e.type))
        .sort((a, b) => a.minute - b.minute)
        .map((e) => `${e.minute}': ${e.title}${e.player ? ` (${e.player})` : ''} — ${e.team === 'HOME' ? match.homeTeam : match.awayTeam}`)
        .join('\n');

      if (!events) return [];

      const prompt = `You are a football analyst. This match just finished: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam}.

Key events:
${events}

Write exactly 2-3 "turning points" — the moments that decided the match. Each turning point is 1 sentence. No markdown, no numbering, no bullets. Return each on a new line.`;

      const text = await chat(prompt, 200);
      return text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 3);
    } catch (err: any) {
      logger.error('AI generateTurningPoints failed', { error: err.message });
      return AIService.ruleBasedTurningPoints(match);
    }
  }

  // ── Rule-based fallbacks (no API key needed) ────────────────────────────

  static ruleBasedPulse(match: MatchState): string {
    const { homeTeam, awayTeam, score, minute, momentum, stats } = match;
    const leading = score.home > score.away ? homeTeam : score.away > score.home ? awayTeam : null;
    const dominant = momentum.score > 20 ? homeTeam : momentum.score < -20 ? awayTeam : null;

    if (!leading && !dominant) {
      return `${homeTeam} and ${awayTeam} are evenly matched at ${minute}'.`;
    }
    if (leading && dominant === leading) {
      return `${leading} are in control, leading ${score.home}–${score.away} and dominating possession at ${minute}'.`;
    }
    if (leading && dominant && dominant !== leading) {
      return `${leading} lead ${score.home}–${score.away} but ${dominant} are pushing hard for an equaliser.`;
    }
    if (!leading && dominant) {
      return `${dominant} are pushing hard with ${stats.shots.home > stats.shots.away ? score.home : score.away} shots but the scores remain level at ${minute}'.`;
    }
    return `${homeTeam} ${score.home}–${score.away} ${awayTeam} at ${minute}'.`;
  }

  static ruleBasedRecap(match: MatchState): string {
    const goals = match.timeline.filter(e => e.type === 'GOAL');
    if (goals.length === 0) {
      return `No goals yet. ${match.homeTeam} and ${match.awayTeam} are level at ${match.score.home}–${match.score.away} after ${match.minute} minutes.`;
    }
    const summaries = goals.map(g =>
      `${g.minute}' ${g.team === 'HOME' ? match.homeTeam : match.awayTeam}${g.player ? ` (${g.player})` : ''}`
    );
    return `Goals: ${summaries.join(', ')}. Score: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam}.`;
  }

  static ruleBasedTurningPoints(match: MatchState): string[] {
    return match.timeline
      .filter(e => ['GOAL', 'RED_CARD'].includes(e.type))
      .sort((a, b) => a.minute - b.minute)
      .slice(0, 3)
      .map(e => `${e.minute}': ${e.title} — ${e.team === 'HOME' ? match.homeTeam : match.awayTeam}.`);
  }
}
