# TxLINE Integration

## Authentication

TxLINE uses a two-header auth scheme on every request:

```
Authorization: Bearer <TXLINE_JWT>
X-Api-Token: <TXLINE_API_KEY>
```

**JWT** — obtained by calling `POST /auth/guest/start` (no auth required). Expires in 30 days. The backend stores it in `backend/.env` as `TXLINE_JWT`.

**API Token** — obtained via the on-chain Solana subscription flow. For the free hackathon tier the smart contract charges 0 TxLINE tokens but the on-chain `subscribe` transaction must still be confirmed. The resulting `txSig` is used to activate the token at `POST /api/token/activate`. The activated token is stored as `TXLINE_API_KEY`.

**Solana subscription sign-up:** The project was registered through the TxLINE on-chain activation flow on Solana (free World Cup tier, `competitionId=72`). The `TXLINE_API_KEY` in `backend/.env` is the activated API token returned after the on-chain subscription was confirmed.

---

## Endpoints Used

### `GET /api/fixtures/snapshot`

**Purpose:** Returns all fixtures the subscription covers. This is the primary discovery endpoint — called every 30s.

**Auth:** Both headers required.

**Key query param:** `competitionId=72` (FIFA World Cup 2026)

**Response shape:**
```json
[
  {
    "FixtureId": 18257739,
    "StartTime": 1752955200000,
    "Competition": "FIFA World Cup 2026",
    "CompetitionId": 72,
    "Participant1": "Spain",
    "Participant2": "Argentina",
    "Participant1IsHome": true,
    "GameState": 1
  }
]
```

**`GameState` values:**
| Value | Meaning |
|---|---|
| `1` | Scheduled / not started |
| `2` | First half |
| `3` | Half time |
| `4` | Second half |
| `5` | Full time |
| `6` | Cancelled |
| `null` / absent | Finished (TxLINE convention for past fixtures) |

**Key discovery:** Finished fixtures fall off the snapshot. Once a match ends and some time passes, it no longer appears in the snapshot at all. Our `MatchEngine` bootstraps known finished fixture IDs directly via `scores/snapshot` to keep them in the Recent tab.

---

### `GET /api/scores/snapshot/:fixtureId`

**Purpose:** Returns the full sequence of score events for a fixture — past and present. This is the most complete source of truth for any fixture's state.

**Used for:** All live matches (fast poll every 10s), upcoming matches, and known finished fixtures that dropped off the fixture snapshot.

**Response shape:**
```json
[
  {
    "FixtureId": 18241006,
    "Id": 12345,
    "Seq": 425,
    "Ts": 1752886200000,
    "Action": "goal",
    "StatusId": 4,
    "Clock": { "Running": true, "Seconds": 3720 },
    "Stats": { "1": 1, "2": 1, "7": 3, "8": 2 },
    "Participant": 2,
    "Confirmed": true
  }
]
```

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `Action` | string | Event type: `goal`, `yellow_card`, `red_card`, `corner`, `shot`, `possession`, `status`, `kickoff`, `additional_time`, … |
| `StatusId` | number | Match phase: 1=pre, 2=H1, 3=HT, 4=H2, 5=FT, 7=ET1, 8=HTET, 9=ET2, 10=FET, 12=PE, 13=FPE, **100=game_finalised** |
| `Clock.Seconds` | number | Elapsed seconds in the current period |
| `Stats` | object | Numeric-keyed cumulative totals (see stat key map below) |
| `Score` | object | Cumulative score breakdown by period |
| `Participant` | 1 or 2 | Which team performed the action |
| `Possession` | 1 or 2 | Which team has the ball (on possession events) |
| `Data` | object | Event-specific payload (e.g. `{ Outcome: "OnTarget" }` on shot events) |

**Stats key map (confirmed from live data):**

| Key | Meaning |
|---|---|
| `1` | Participant1 total goals |
| `2` | Participant2 total goals |
| `3` | Participant1 yellow cards |
| `4` | Participant2 yellow cards |
| `5` | Participant1 red cards |
| `6` | Participant2 red cards |
| `7` | Participant1 corners |
| `8` | Participant2 corners |
| `3001` | Participant1 shots (H2-series) |
| `3002` | Participant2 shots |
| `3003` | Participant1 shots on target |
| `3004` | Participant2 shots on target |
| `3007` | Participant1 fouls |
| `3008` | Participant2 fouls |

---

### `GET /api/scores/updates/:fixtureId`

**Purpose:** Returns only the incremental score update events since the last poll. Lighter than the full snapshot.

**Used for:** Referenced in `TxLineClient.ts` — available as a lighter alternative to `scores/snapshot` for live matches. Currently the backend uses `scores/snapshot` for reliability (always returns the full current state).

---

### `GET /api/scores/historical/:fixtureId`

**Purpose:** Returns completed fixture score history. Works for fixtures 6h–2 weeks old.

**Used for:** Fixtures where `MatchNormalizer.isFixtureFinished(GameState) === true` during the main 30s tick.

---

### `POST /auth/guest/start`

**Purpose:** Obtain a fresh guest JWT. No auth required.

**Used for:** JWT renewal when the current JWT is about to expire (30-day TTL). The `TxLineClient.renewJwt()` method wraps this.

---

## Data Normalisation — TxLINE → MatchState

`MatchNormalizer.normalize(fixture, events)` converts raw TxLINE data into the `MatchState` shape the frontend consumes.

### Status detection

The normalizer picks the highest-priority `StatusId` seen across all events:

```
game_finalised (100) > FT (5,10,13) > Penalties (12) > ET (7,8,9,11) > H2 (4) > HT (3) > H1 (2) > pre (1)
```

If no events carry a `StatusId`, it falls back to the fixture-level `GameState`.

### Score extraction (3-strategy cascade)

1. **Primary** — read `Stats["1"]` (P1 goals) and `Stats["2"]` (P2 goals) from the latest event with a non-empty Stats object. These are confirmed cumulative totals.
2. **Fallback** — read `Score.Participant1.Total.Goals` / `Score.Participant2.Total.Goals` from the last event that has a `Score` object.
3. **Last resort** — count `Action === "goal"` events where `Confirmed !== false`.

### Minute

`Math.ceil(Clock.Seconds / 60)` on the event with the highest `Clock.Seconds` value.

### Possession %

Count of `possession` and `safe_possession` events per team as a proxy (only used when > 5 events are present, otherwise defaults to 50/50).

### Shots

Prefer `Stats["3001"]`/`Stats["3002"]` (3000-series cumulative). Fall back to counting `Action === "shot"` events.

### Dangerous attacks

Count of `attack_possession`, `danger_possession`, and `high_danger_possession` events per team.

---

## Fixtures Currently Live (July 18, 2026)

| FixtureId | Match | GameState | Kickoff UTC |
|---|---|---|---|
| 18257865 | France vs England | 1 (upcoming) | Jul 18 21:00 |
| 18257739 | Spain vs Argentina | 1 (upcoming) | Jul 19 19:00 |
| 18241006 | England vs Argentina | finished | Jul 15 19:00 (hardcoded) |

The two upcoming fixtures are the World Cup semi-finals. The England vs Argentina match (final score 1–2) dropped off the snapshot and is bootstrapped from `KNOWN_WC_FINISHED_FIXTURES`.

---

## Known Gotchas

**Devnet vs Mainnet:** `txline-dev.txodds.com` only exposes ~2 fixtures and has no historical data. Always use `txline.txodds.com` (`TXLINE_BASE_URL=https://txline.txodds.com`) for the full World Cup dataset.

**Finished fixtures fall off the snapshot:** TxLINE's `fixtures/snapshot` only returns fixtures active within a time window. Completed matches must be bootstrapped directly via `scores/snapshot/:id`.

**`StatusId=100` means finished:** The `game_finalised` event carries `StatusId=100`. This is the definitive signal that a match is over.

**Stats keys are numeric strings:** When reading `event.Stats`, use `s["1"]` not `s[1]` — JSON object keys are always strings.

**One goal event may cover multiple goals:** The `scores/snapshot` event log sometimes has fewer `Action=goal` events than actual goals scored (events before the snapshot window are not included). The `Stats["1"]`/`Stats["2"]` keys are always accurate — use them as the primary score source.
