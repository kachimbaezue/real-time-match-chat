import { Router, Request, Response } from 'express';
import { matchEngine } from '../services/MatchEngine';
import { AIService } from '../ai/AIService';
import { logger } from '../utils/logger';
import { newsAPIClient, NewsArticle } from '../services/NewsAPIClient';

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

type HotItemType =
  | 'goal' | 'yellow_card' | 'red_card' | 'penalty'
  | 'insight' | 'stat' | 'status' | 'fulltime' | 'substitution'
  | 'news';

interface HotItem {
  id: string;
  type: HotItemType;
  importance: number; // 1=low 2=medium 3=high
  text: string;
  minute: number;
  match?: {
    id: string;
    home: string;
    away: string;
    homeScore: number;
    awayScore: number;
    status: string;
    minute: number;
    competition: string;
    stage: string;
  };
  news?: {
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    source: string;
    author: string | null;
  };
  ts: number;
  detail?: string;
}

// Simple in-memory AI text cache so we don't re-call Groq on every /hot request
const aiTextCache = new Map<string, string>();

/**
 * GET /hot
 * Returns a Threads/spaghetti-thread feed of World Cup hot moments,
 * sourced from TxLINE live data. Key events get AI-written thread text via Groq.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const all = matchEngine.getAllMatches();
    const feed: HotItem[] = [];

    // Collect all items (sync) first, then enrich with AI async
    for (const match of all) {
      const matchCtx = {
        id: match.id,
        home: match.homeTeam,
        away: match.awayTeam,
        homeScore: match.score.home,
        awayScore: match.score.away,
        status: mapStatusFrontend(match.status),
        minute: match.minute,
        competition: match.competition,
        stage: match.competition,
      };

      // 1. KEY TIMELINE EVENTS — goals, cards, penalties
      for (const ev of match.timeline) {
        const importance = eventImportance(ev.type);
        if (importance === 0) continue;

        const teamName = ev.team === 'HOME' ? match.homeTeam
          : ev.team === 'AWAY' ? match.awayTeam : '';

        const cacheKey = `ev-${match.id}-${ev.minute}-${ev.type}`;
        let text = aiTextCache.get(cacheKey);

        if (!text) {
          // Sync fallback text immediately
          text = buildEventText(ev, teamName, match);
          aiTextCache.set(cacheKey, text);
          // Enrich with Groq AI in background for next request
          enrichEventText({ ...ev, team: ev.team ?? '' }, teamName, match, cacheKey).catch(() => {});
        }

        feed.push({
          id: cacheKey,
          type: ev.type.toLowerCase() as HotItemType,
          importance,
          text,
          minute: ev.minute,
          match: matchCtx,
          ts: ev.timestamp ? Number(ev.timestamp) : (Date.now() - ev.minute * 60_000),
          detail: ev.player,
        });
      }

      // 2. AI MATCH PULSE insight (if available)
      const pulseText = Array.isArray(match.pulse)
        ? match.pulse[0]
        : match.pulse;
      if (pulseText) {
        feed.push({
          id: `pulse-${match.id}`,
          type: 'insight',
          importance: 2,
          text: pulseText,
          minute: match.minute,
          match: matchCtx,
          ts: Date.now() - 5_000,
        });
      }

      // 3. FULL TIME milestone
      if (match.status === 'FINISHED') {
        const cacheKey = `ft-${match.id}`;
        let text = aiTextCache.get(cacheKey);
        if (!text) {
          text = buildFtText(match);
          aiTextCache.set(cacheKey, text);
          enrichFtText(match, cacheKey).catch(() => {});
        }
        feed.push({
          id: cacheKey,
          type: 'fulltime',
          importance: 3,
          text,
          minute: 90,
          match: matchCtx,
          // Place FT just after the last timeline event
          ts: Date.now() - 90_000,
        });
      }

      // 4. STATS HIGHLIGHT — big possession/shot disparity during live match
      if (['FIRST_HALF','SECOND_HALF'].includes(match.status) && match.minute > 15) {
        const possDiff = Math.abs(match.stats.possession.home - match.stats.possession.away);
        if (possDiff > 15) {
          const dominant = match.stats.possession.home > match.stats.possession.away
            ? match.homeTeam : match.awayTeam;
          const pct = Math.max(match.stats.possession.home, match.stats.possession.away);
          feed.push({
            id: `poss-${match.id}`,
            type: 'stat',
            importance: 1,
            text: `${dominant} commanding possession — ${pct}% of the ball at ${match.minute}'. The game is being played on their terms.`,
            minute: match.minute,
            match: matchCtx,
            ts: Date.now() - 30_000,
          });
        }

        const shotsDiff = match.stats.shots.home - match.stats.shots.away;
        if (Math.abs(shotsDiff) >= 4) {
          const domTeam = shotsDiff > 0 ? match.homeTeam : match.awayTeam;
          const shots = Math.max(match.stats.shots.home, match.stats.shots.away);
          feed.push({
            id: `shots-${match.id}`,
            type: 'stat',
            importance: 1,
            text: `${domTeam} applying serious pressure — ${shots} shots at ${match.minute}'. The xG is climbing.`,
            minute: match.minute,
            match: matchCtx,
            ts: Date.now() - 45_000,
          });
        }
      }
    }

    // 5. ADD WORLD CUP NEWS FROM NEWSAPI
    try {
      const newsArticles = await newsAPIClient.fetchWorldCupNews();
      for (const article of newsArticles) {
        feed.push({
          id: `news-${article.url}`,
          type: 'news',
          importance: 2,
          text: article.title,
          minute: 0,
          ts: new Date(article.publishedAt).getTime(),
          news: {
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage,
            source: article.source.name,
            author: article.author,
          },
        });
      }
    } catch (newsErr) {
      logger.warn('Failed to fetch news, skipping', newsErr);
    }

    // Sort: importance DESC, then ts DESC (newest first within same importance)
    feed.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.ts - a.ts;
    });

    res.json({ feed: feed.slice(0, 80), total: feed.length });
  } catch (err: any) {
    logger.error('Hot feed error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── AI enrichment (async, populates cache for next request) ──────────────────

async function enrichEventText(
  ev: { type: string; minute: number; player?: string; team: string },
  teamName: string,
  match: { homeTeam: string; awayTeam: string; score: { home: number; away: number } },
  cacheKey: string,
): Promise<void> {
  if ((aiTextCache.get(cacheKey)?.length ?? 0) > 80) return; // already enriched

  try {
    const prompt = buildEventPrompt(ev, teamName, match);
    if (!prompt) return;
    // Use the Groq client via AIService's internal chat method
    const { env } = await import('../config/env');
    if (!env.GROQ_API_KEY) return;

    const OpenAI = (await import('openai')).default;
    const groq = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.7,
    });
    const text = resp.choices[0]?.message?.content?.trim();
    if (text && text.length > 20) {
      aiTextCache.set(cacheKey, text);
    }
  } catch {
    // Groq unavailable — keep sync fallback
  }
}

async function enrichFtText(
  match: {
    homeTeam: string; awayTeam: string;
    score: { home: number; away: number };
    id: string; stats: any; timeline: any[];
  },
  cacheKey: string,
): Promise<void> {
  if ((aiTextCache.get(cacheKey)?.length ?? 0) > 80) return;
  try {
    const { env } = await import('../config/env');
    if (!env.GROQ_API_KEY) return;

    const goals = match.timeline
      .filter((e: any) => e.type === 'GOAL')
      .map((e: any) => `${e.minute}' ${e.team === 'HOME' ? match.homeTeam : match.awayTeam}${e.player ? ` (${e.player})` : ''}`)
      .join(', ');

    const prompt = `You're writing a single thread post about a football match result. Keep it punchy, factual, max 2 sentences, no hashtags, no emojis.

Match: ${match.homeTeam} ${match.score.home}–${match.score.away} ${match.awayTeam}
Goals: ${goals || 'none recorded'}

Write the thread post:`;

    const OpenAI = (await import('openai')).default;
    const groq = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 90,
      temperature: 0.7,
    });
    const text = resp.choices[0]?.message?.content?.trim();
    if (text && text.length > 20) {
      aiTextCache.set(cacheKey, text);
    }
  } catch { /* ignore */ }
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildEventPrompt(
  ev: { type: string; minute: number; player?: string; team: string },
  teamName: string,
  match: { homeTeam: string; awayTeam: string; score: { home: number; away: number } },
): string {
  const score = `${match.score.home}–${match.score.away}`;
  const player = ev.player ? ` by ${ev.player}` : '';
  switch (ev.type) {
    case 'GOAL':
      return `Write ONE punchy sentence (max 20 words) about this World Cup goal: ${teamName} scored${player} at ${ev.minute}' to make it ${match.homeTeam} ${score} ${match.awayTeam}. No hashtags, no emojis, just the text.`;
    case 'RED_CARD':
      return `Write ONE punchy sentence (max 20 words) about this World Cup red card: ${teamName}${player} dismissed at ${ev.minute}'. The match is ${match.homeTeam} ${score} ${match.awayTeam}. No hashtags, no emojis.`;
    case 'YELLOW_CARD':
      return `Write ONE brief sentence about this yellow card: ${teamName}${player} booked at ${ev.minute}'. Match: ${match.homeTeam} ${score} ${match.awayTeam}. Very short, factual, no hashtags.`;
    default:
      return '';
  }
}

// ── Sync text builders (instant fallback) ─────────────────────────────────────

function buildEventText(
  ev: { type: string; minute: number; player?: string; team?: string },
  teamName: string,
  match: { homeTeam: string; awayTeam: string; score: { home: number; away: number } },
): string {
  const player = ev.player ? ` (${ev.player})` : '';
  const score = `${match.score.home}–${match.score.away}`;
  switch (ev.type) {
    case 'GOAL':
      return `GOAL! ${teamName}${player} scores at ${ev.minute}'! ${match.homeTeam} ${score} ${match.awayTeam}`;
    case 'RED_CARD':
      return `Red card! ${teamName}${player} is sent off at ${ev.minute}'. Down to 10 men.`;
    case 'YELLOW_CARD':
      return `Yellow card — ${teamName}${player} booked at ${ev.minute}'.`;
    case 'PENALTY':
      return `Penalty awarded to ${teamName} at ${ev.minute}'! High stakes moment.`;
    default:
      return `${teamName} — ${ev.type.toLowerCase()} at ${ev.minute}'`;
  }
}

function buildFtText(match: {
  homeTeam: string; awayTeam: string; score: { home: number; away: number };
}): string {
  const { homeTeam, awayTeam, score } = match;
  if (score.home > score.away)
    return `Full time. ${homeTeam} ${score.home}–${score.away} ${awayTeam}. ${homeTeam} win.`;
  if (score.away > score.home)
    return `Full time. ${homeTeam} ${score.home}–${score.away} ${awayTeam}. ${awayTeam} win.`;
  return `Full time. ${homeTeam} ${score.home}–${score.away} ${awayTeam}. It ends all square.`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventImportance(type: string): number {
  switch (type) {
    case 'GOAL':       return 3;
    case 'RED_CARD':   return 3;
    case 'PENALTY':    return 2;
    case 'YELLOW_CARD':return 1;
    default:           return 0;
  }
}

function eventEmoji(type: string): string {
  switch (type) {
    case 'GOAL':       return '⚽';
    case 'RED_CARD':   return '🟥';
    case 'YELLOW_CARD':return '🟨';
    case 'PENALTY':    return '🥅';
    default:           return '📌';
  }
}

function mapStatusFrontend(s: string): string {
  if (['FIRST_HALF','HALF_TIME','SECOND_HALF','EXTRA_TIME','PENALTIES'].includes(s)) return 'live';
  if (s === 'FINISHED') return 'finished';
  return 'upcoming';
}

export default router;
