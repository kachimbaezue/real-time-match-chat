import type { TxFixture, TxScoreEvent } from '../txline/TxLineClient';
import { env } from '../config/env';

const FALLBACK_FIXTURE_IDS = [1001, 1002, 1003];

function iso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

export function getFallbackFixtures(competitionId?: number): TxFixture[] {
  const parsedCompetitionId = Number.parseInt(env.TXLINE_WC_COMPETITION_ID || '72', 10);
  const safeCompetitionId = competitionId ?? (Number.isFinite(parsedCompetitionId) ? parsedCompetitionId : 72);

  return [
    {
      FixtureId: 1001,
      CompetitionId: safeCompetitionId,
      Competition: 'FIFA World Cup 2026',
      Participant1: 'Argentina',
      Participant2: 'France',
      Participant1IsHome: true,
      GameState: 5,
      StartTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      Venue: 'MetLife Stadium',
      Stage: 'Final',
    },
    {
      FixtureId: 1002,
      CompetitionId: safeCompetitionId,
      Competition: 'FIFA World Cup 2026',
      Participant1: 'Brazil',
      Participant2: 'Senegal',
      Participant1IsHome: true,
      GameState: 4,
      StartTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      Venue: 'SoFi Stadium',
      Stage: 'Group Stage',
    },
    {
      FixtureId: 1003,
      CompetitionId: safeCompetitionId,
      Competition: 'FIFA World Cup 2026',
      Participant1: 'USA',
      Participant2: 'Mexico',
      Participant1IsHome: true,
      GameState: 1,
      StartTime: iso(24 * 60 + 30),
      Venue: 'Rose Bowl',
      Stage: 'Group Stage',
    },
  ];
}

export function getFallbackFixtureData(fixtureId: number): { fixture: TxFixture; events: TxScoreEvent[] } | undefined {
  const fixtures = getFallbackFixtures();
  const fixture = fixtures.find((item) => item.FixtureId === fixtureId);
  if (!fixture) return undefined;

  if (fixture.FixtureId === 1001) {
    return {
      fixture,
      events: [
        { FixtureId: 1001, seq: 1, ts: iso(-24 * 60 * 60), gameState: 'H1', action: 'goal', minute: 12, team: 'Participant1', player: 'Messi' },
        { FixtureId: 1001, seq: 2, ts: iso(-24 * 60 * 60 + 3), gameState: 'H1', action: 'goal', minute: 36, team: 'Participant2', player: 'Mbappé' },
        { FixtureId: 1001, seq: 3, ts: iso(-24 * 60 * 60 + 8), gameState: 'F', action: 'goal', minute: 80, team: 'Participant1', player: 'Di María' },
        { FixtureId: 1001, seq: 4, ts: iso(-24 * 60 * 60 + 9), gameState: 'F', action: 'game_finalised', minute: 90, team: 'Participant1', player: 'Full Time' },
      ],
    };
  }

  if (fixture.FixtureId === 1002) {
    return {
      fixture,
      events: [
        { FixtureId: 1002, seq: 1, ts: iso(-10), gameState: 'H2', action: 'goal', minute: 58, team: 'Participant1', player: 'Vinícius Jr.' },
        { FixtureId: 1002, seq: 2, ts: iso(-8), gameState: 'H2', action: 'goal', minute: 67, team: 'Participant2', player: 'Sarr' },
        { FixtureId: 1002, seq: 3, ts: iso(-5), gameState: 'H2', action: 'match_status', minute: 68, team: 'Participant1', player: 'Live' },
      ],
    };
  }

  return {
    fixture,
    events: [],
  };
}

export function shouldUseFallbackFixtures(): boolean {
  return process.env.FALLBACK_FIXTURES_ENABLED !== 'false';
}
