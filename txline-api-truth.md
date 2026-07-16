# TxLINE API Ground Truth — confirmed via terminal July 16, 2026

## What the fixture snapshot (competitionId=72) actually returns

Only 2 fixtures come back — both GameState=1 (scheduled/upcoming):

| FixtureId | Teams | GameState | StartTime UTC |
|---|---|---|---|
| 18257739 | Spain vs Argentina | 1 (scheduled) | Jul 19 19:00 UTC — 81.6h from now |
| 18257865 | France vs England | 1 (scheduled) | Jul 18 21:00 UTC — 57.5h from now |

**THE FINISHED MATCH (England 1–2 Argentina) IS NOT IN THE FIXTURE SNAPSHOT.**
FixtureId 18241006 started Jul 15 ~19:00 UTC, is 14+ hours past. 
GameState=1 was its fixture state (never updated). It is NOT in the competitionId=72 snapshot anymore.
The only way to see it is directly via scores/snapshot/18241006.

## Stats key map (confirmed from StatusId=5 / FT event on 18241006)

| Key | Meaning |
|---|---|
| 1 | P1 total goals |
| 2 | P2 total goals |
| 3 | P1 yellow cards |
| 4 | P2 yellow cards |
| 5 | P1 red cards |
| 6 | P2 red cards |
| 7 | P1 corners |
| 8 | P2 corners |
| 3001 | P1 H2 goals |
| 3002 | P2 H2 goals |
| 3004 | P2 H2 corners |
| 3008 | P2 H2 corners (total) |

## Match 18241006 — England vs Argentina (FINISHED)

- Participant1 = England (IsHome=true) 
- Participant2 = Argentina
- Final score: England 1 – 2 Argentina (keys 1=1, 2=2)
- StatusId sequence: 1 (pre) → 3 (HT) → 4 (H2) → 5 (FT) → 100 (game_finalised)
- **StatusId=100 = game_finalised = FINISHED**
- StatusId=5 = "status" action with Data.StatusId=5 = Full Time confirmed
- halftime_finalised event at Seq=425
- game_finalised event at Seq=962 (StatusId=100)
- 1 goal event at Seq=872 (H2, Argentina scored) — only 1 goal event despite 2 goals total
  - The first goal likely happened before the snapshot window

## Hot page empty because:
- matchEngine only stores competitionId=72 fixtures
- The 2 fixtures it loads are upcoming (GameState=1)
- Upcoming matches have no events → no timeline → hot feed is empty

## Fix strategy:
1. MatchEngine must also load known finished fixture IDs that aren't in the snapshot anymore
2. Specifically, add 18241006 (ENG vs ARG) as a known WC fixture to always sync
3. Status detection: StatusId=100 (game_finalised) and StatusId=5 (FT status event) both = FINISHED
4. Score comes from Stats key "1" (P1 goals) and "2" (P2 goals) on latest stats event
5. Fixture snapshot only has 2 upcoming games — that's all TxLINE shows for comp 72 right now
