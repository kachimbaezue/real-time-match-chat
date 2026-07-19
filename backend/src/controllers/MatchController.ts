import { Request, Response } from 'express';
import { matchEngine } from '../services/MatchEngine';
import { MatchState } from '../types';
import { logger } from '../utils/logger';

/**
 * Best-effort lookup: map a full team name to its FIFA 3-letter code.
 * Falls back to the first 3 uppercase letters if not found — better than nothing
 * but the real fix is having TxLINE send short codes directly.
 */
const TEAM_SHORT: Record<string, string> = {
  // FIFA World Cup nations (common English names)
  'Argentina': 'ARG', 'Australia': 'AUS', 'Belgium': 'BEL', 'Brazil': 'BRA',
  'Cameroon': 'CMR', 'Canada': 'CAN', 'Costa Rica': 'CRC', 'Croatia': 'CRO',
  'Denmark': 'DEN', 'Ecuador': 'ECU', 'England': 'ENG', 'France': 'FRA',
  'Germany': 'GER', 'Ghana': 'GHA', 'IR Iran': 'IRN', 'Iran': 'IRN',
  'Japan': 'JPN', 'Mexico': 'MEX', 'Morocco': 'MAR', 'Netherlands': 'NED',
  'Poland': 'POL', 'Portugal': 'POR', 'Qatar': 'QAT', 'Saudi Arabia': 'KSA',
  'Senegal': 'SEN', 'Serbia': 'SRB', 'South Korea': 'KOR', 'Korea Republic': 'KOR',
  'Spain': 'ESP', 'Switzerland': 'SUI', 'Tunisia': 'TUN', 'United States': 'USA',
  'USA': 'USA', 'Uruguay': 'URU', 'Wales': 'WAL', 'Italy': 'ITA',
  'Colombia': 'COL', 'Chile': 'CHI', 'Peru': 'PER', 'Bolivia': 'BOL',
  'Paraguay': 'PAR', 'Venezuela': 'VEN', 'Honduras': 'HON', 'Panama': 'PAN',
  'Jamaica': 'JAM', 'Trinidad and Tobago': 'TTO', 'Guatemala': 'GUA',
  'El Salvador': 'SLV', 'Haiti': 'HAI', 'Cuba': 'CUB',
  'Nigeria': 'NGA', 'Egypt': 'EGY', 'Algeria': 'ALG', 'Ivory Coast': 'CIV',
  "Côte d'Ivoire": 'CIV', 'South Africa': 'RSA', 'Zambia': 'ZAM',
  'DR Congo': 'COD', 'Mali': 'MLI', 'Mozambique': 'MOZ',
  'New Zealand': 'NZL',
};

function toShortCode(teamName: string): string {
  return TEAM_SHORT[teamName] ?? teamName.slice(0, 3).toUpperCase();
}

function toFrontendMatch(m: MatchState) {
  return {
    id: m.id,
    home: { name: m.homeTeam, short: toShortCode(m.homeTeam), score: m.score.home },
    away: { name: m.awayTeam, short: toShortCode(m.awayTeam), score: m.score.away },
    status: mapStatus(m.status),
    minute: m.minute,
    kickoff: formatKickoff(m.kickoffTime),
    competition: m.competition,
    stage: m.competition,
    venue: m.venue,
    momentum: m.momentum.score,
    headline: m.pulse?.split('\n')[0]?.split('. ')[0] ?? '',
    pulse: m.pulse
      ? m.pulse.split('\n\n').map(p => p.trim()).filter(Boolean)
      : [],
    joinedNow: m.recap ? [m.recap] : [],
    stats: matchEngine.mapStats(m),
    winProbability: m.winProbability
      ? [m.winProbability.home, m.winProbability.draw, m.winProbability.away]
      : null,
    turningPoints: m.turningPoints ?? [],
    lineups: m.lineups ? {
      home: m.lineups.home.map(p => ({
        name: p.name,
        shortName: p.shortName,
        number: p.number,
        position: p.position,
        starter: p.starter,
      })),
      away: m.lineups.away.map(p => ({
        name: p.name,
        shortName: p.shortName,
        number: p.number,
        position: p.position,
        starter: p.starter,
      })),
    } : undefined,
    timeline: m.timeline.map((e) => ({
      minute: e.minute,
      type: mapEventType(e.type),
      team: e.team === 'HOME' ? 'home' : e.team === 'AWAY' ? 'away' : undefined,
      label: e.title,
      detail: e.player,
    })),
  };
}

function mapStatus(s: string): 'live' | 'upcoming' | 'finished' {
  if (['FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES'].includes(s))
    return 'live';
  if (s === 'FINISHED') return 'finished';
  return 'upcoming';
}

function formatKickoff(isoOrMs: string | number): string {
  try {
    const raw = typeof isoOrMs === 'string' && /^\d+$/.test(isoOrMs)
      ? Number(isoOrMs)
      : isoOrMs;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(isoOrMs);
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.getTime()) / 86_400_000);
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (diffDays === 0) return `Today · ${time}`;
    if (diffDays === 1) return `Tomorrow · ${time}`;
    if (diffDays === -1) return `Yesterday · ${time}`;
    const date = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return `${date} · ${time}`;
  } catch {
    return String(isoOrMs);
  }
}

function mapEventType(t: string): string {
  const map: Record<string, string> = {
    GOAL: 'goal', YELLOW_CARD: 'yellow', RED_CARD: 'red',
    PENALTY: 'penalty', SUBSTITUTION: 'sub', CORNER: 'kickoff', MATCH_STATUS: 'kickoff',
  };
  return map[t] ?? 'kickoff';
}

function getId(req: Request): string {
  const id = req.params['id'];
  return Array.isArray(id) ? id[0] : String(id);
}

export class MatchController {
  /** GET /matches/previous → all finished matches, newest first */
  static getPreviousMatches(_req: Request, res: Response): void {
    try {
      const matches = matchEngine.getRecentMatches().map(toFrontendMatch);
      res.json({ matches, total: matches.length });
    } catch (err) {
      logger.error('Error fetching previous matches', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /** GET /matches/live → { live, upcoming, recent } */
  static getLiveMatches(_req: Request, res: Response): void {
    try {
      res.json({
        live:     matchEngine.getLiveMatches().map(toFrontendMatch),
        upcoming: matchEngine.getUpcomingMatches().map(toFrontendMatch),
        recent:   matchEngine.getRecentMatches().map(toFrontendMatch),
      });
    } catch (err) {
      logger.error('Error fetching live matches', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /** GET /matches/:id */
  static getMatchById(req: Request, res: Response): void {
    try {
      const match = matchEngine.getMatch(getId(req));
      if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
      res.json(toFrontendMatch(match));
    } catch (err) {
      logger.error('Error fetching match', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static getMatchTimeline(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ timeline: match.timeline });
  }

  static getMatchStats(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ stats: matchEngine.mapStats(match) });
  }

  static getMatchMomentum(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ momentum: match.momentum });
  }

  static getMatchPulse(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ pulse: match.pulse });
  }

  static getMatchRecap(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ recap: match.recap });
  }

  static getMatchProbability(req: Request, res: Response): void {
    const match = matchEngine.getMatch(getId(req));
    if (!match) { res.status(404).json({ error: 'Match not found' }); return; }
    res.json({ winProbability: match.winProbability ?? { home: 33, draw: 34, away: 33 } });
  }

  /**
   * GET /matches/debug/snapshot
   * Exposes the raw TxLINE snapshot + engine state for debugging.
   */
  static async debugSnapshot(_req: Request, res: Response): Promise<void> {
    try {
      const { txLineClient } = await import('../txline/TxLineClient');
      const { MatchNormalizer } = await import('../services/MatchNormalizer');
      const { env } = await import('../config/env');

      const wcId = env.TXLINE_WC_COMPETITION_ID ? parseInt(env.TXLINE_WC_COMPETITION_ID, 10) : undefined;

      // Fetch snapshot both with and without the competitionId filter
      const snapshotFiltered = wcId ? await txLineClient.getFixtures(wcId) : [];
      const snapshotAll      = await txLineClient.getFixtures();

      // Show ALL fixtures in the unfiltered snapshot so we can see what CompetitionIds are present
      const allByCompetition: Record<string, { count: number; sample: any }> = {};
      for (const f of snapshotAll) {
        const key = `${f.CompetitionId} — ${f.Competition}`;
        if (!allByCompetition[key]) {
          allByCompetition[key] = { count: 0, sample: { FixtureId: f.FixtureId, Participant1: f.Participant1, Participant2: f.Participant2, GameState: f.GameState, StartTime: f.StartTime } };
        }
        allByCompetition[key].count++;
      }

      const wcFixtures = snapshotAll.filter((f: any) => {
        const matchesId = wcId !== undefined && f.CompetitionId === wcId;
        const isWcName = (f.Competition ?? '').toLowerCase().includes('world cup');
        const WC_START = new Date('2026-06-01').getTime();
        const WC_END   = new Date('2026-07-31').getTime();
        const startMs  = typeof f.StartTime === 'number' ? f.StartTime : new Date(f.StartTime ?? '').getTime();
        const isInWindow = Number.isFinite(startMs) && startMs >= WC_START && startMs <= WC_END;
        return matchesId || isWcName || isInWindow;
      });

      const finished = wcFixtures.filter((f: any) => MatchNormalizer.isFixtureFinished(f.GameState));
      const live     = wcFixtures.filter((f: any) => [2, 3, 4, 7, 8, 9, 11, 12].includes(f.GameState));
      const upcoming = wcFixtures.filter((f: any) => f.GameState === 1);
      const ambiguous = wcFixtures.filter((f: any) => f.GameState === null || f.GameState === undefined);

      const allInMemory  = matchEngine.getAllMatches();
      const recentInMem  = matchEngine.getRecentMatches();

      res.json({
        engineState: {
          total:    allInMemory.length,
          live:     allInMemory.filter(m => ['FIRST_HALF','HALF_TIME','SECOND_HALF','EXTRA_TIME','PENALTIES'].includes(m.status)).length,
          upcoming: allInMemory.filter(m => m.status === 'NOT_STARTED').length,
          recent:   recentInMem.length,
          recentMatches: recentInMem.map(m => ({ id: m.id, home: m.homeTeam, away: m.awayTeam, status: m.status, score: m.score })),
        },
        snapshot: {
          totalAll:   snapshotAll.length,
          totalFiltered: snapshotFiltered.length,
          wcTotal:    wcFixtures.length,
          wcFinished: finished.length,
          wcLive:     live.length,
          wcUpcoming: upcoming.length,
          wcAmbiguous: ambiguous.length,
          wcId,
          // All competitions in the snapshot — crucial for diagnosing wrong competitionId
          competitionBreakdown: allByCompetition,
          wcFixtures: wcFixtures.map((f: any) => ({
            FixtureId: f.FixtureId,
            Participant1: f.Participant1,
            Participant2: f.Participant2,
            GameState: f.GameState,
            StartTime: f.StartTime,
            Competition: f.Competition,
            CompetitionId: f.CompetitionId,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /matches/debug/fixture/:id
   * Shows RAW TxLINE data vs our normalized data for a specific fixture
   */
  static async debugFixture(req: Request, res: Response): Promise<void> {
    try {
      const { txLineClient } = await import('../txline/TxLineClient');
      const { MatchNormalizer } = await import('../services/MatchNormalizer');
      const fixtureId = parseInt(getId(req), 10);

      const rawScores = await txLineClient.getScoresSnapshot(fixtureId);
      const rawFixture = (await txLineClient.getFixtures()).find((f: any) => f.FixtureId === fixtureId);

      // Build normalized state if possible
      let normalizedMatch = null;
      const inMemoryMatch = matchEngine.getMatch(String(fixtureId));

      if (rawFixture && rawScores.length > 0) {
        normalizedMatch = MatchNormalizer.normalize(rawFixture, rawScores);
      }

      res.json({
        fixtureId,
        raw: {
          fixture: rawFixture,
          scores: rawScores,
        },
        normalizedMatch: inMemoryMatch || normalizedMatch,
        frontendMatch: inMemoryMatch ? toFrontendMatch(inMemoryMatch) : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
