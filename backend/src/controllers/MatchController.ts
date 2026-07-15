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
    headline: m.pulse?.split('. ')[0] ?? '',
    pulse: m.pulse ? [m.pulse] : [],
    joinedNow: m.recap ? [m.recap] : [],
    stats: matchEngine.mapStats(m),
    winProbability: m.winProbability
      ? [m.winProbability.home, m.winProbability.draw, m.winProbability.away]
      : [33, 34, 33],
    turningPoints: m.turningPoints ?? [],
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
    const d = new Date(typeof isoOrMs === 'number' ? isoOrMs : isoOrMs);
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
  return String(req.params.id);
}

export class MatchController {
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
   * Shows: total fixtures in memory, how many are finished, and the first 10 raw snapshot fixtures.
   */
  static async debugSnapshot(_req: Request, res: Response): Promise<void> {
    try {
      const { txLineClient } = await import('../txline/TxLineClient');
      const { MatchNormalizer } = await import('../services/MatchNormalizer');
      const { env } = await import('../config/env');

      const wcId = env.TXLINE_WC_COMPETITION_ID ? parseInt(env.TXLINE_WC_COMPETITION_ID, 10) : undefined;
      const snapshot = await txLineClient.getFixtures(wcId);

      const wcFixtures = wcId
        ? snapshot.filter((f: any) => f.CompetitionId === wcId)
        : snapshot.filter((f: any) => f.Competition === 'World Cup');

      const finished = wcFixtures.filter((f: any) => MatchNormalizer.isFixtureFinished(f.GameState));
      const live     = wcFixtures.filter((f: any) => [2, 3, 4, 7, 8, 9, 11, 12].includes(f.GameState));
      const upcoming = wcFixtures.filter((f: any) => f.GameState === 1);

      const allInMemory  = matchEngine.getAllMatches();
      const recentInMem  = matchEngine.getRecentMatches();

      res.json({
        engineState: {
          total:    allInMemory.length,
          live:     allInMemory.filter(m => ['FIRST_HALF','HALF_TIME','SECOND_HALF','EXTRA_TIME','PENALTIES'].includes(m.status)).length,
          upcoming: allInMemory.filter(m => m.status === 'NOT_STARTED').length,
          recent:   recentInMem.length,
        },
        snapshot: {
          total:    snapshot.length,
          wcTotal:  wcFixtures.length,
          finished: finished.length,
          live:     live.length,
          upcoming: upcoming.length,
          wcId,
          sampleFinished: finished.slice(0, 5).map((f: any) => ({
            FixtureId: f.FixtureId,
            Participant1: f.Participant1,
            Participant2: f.Participant2,
            GameState: f.GameState,
            StartTime: f.StartTime,
          })),
          sampleAll: wcFixtures.slice(0, 10).map((f: any) => ({
            FixtureId: f.FixtureId,
            Participant1: f.Participant1,
            Participant2: f.Participant2,
            GameState: f.GameState,
            StartTime: f.StartTime,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
