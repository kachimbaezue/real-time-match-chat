# AI Features

## Provider

**Primary:** Groq (`llama-3.3-70b-versatile`) — free tier, sub-second latency.  
**Fallback:** OpenAI (`gpt-4o-mini`) — if `OPENAI_API_KEY` is set and Groq is unavailable.  
**Rule-based fallback:** All features work with zero API keys via template-based generation.

Both providers use the OpenAI-compatible chat completions API. Groq is accessed via `baseURL: "https://api.groq.com/openai/v1"`.

---

## Feature 1 — Match Pulse

**Trigger:** Score change, or every 5 minutes during a live match.  
**Output:** 1–2 sentences describing the current state of play.  
**Shown in:** Match detail page "Match Pulse" card, and as the `headline` field on match cards.

**Context fed to the model:**
- Score, minute, match status
- Momentum score and state
- Possession %, shots, shots on target, xG, corners
- 6 most recent timeline events

**Prompt goal:** Factual present-tense narrative. No invented stats, no markdown.

**Rule-based fallback logic:**
- If a team is leading AND dominating momentum → "X are in control, leading Y–Z..."
- If leading but opponent has momentum → "X lead but Y are pushing for an equaliser"
- Otherwise → simple score summary

---

## Feature 2 — If You Joined Now

**Trigger:** Same as Match Pulse (score change or every 5 minutes).  
**Output:** Under-100-word catch-up summary for a viewer who just opened the app.  
**Shown in:** Match detail page "If You Joined Now" card.

**Context fed to the model:**
- Score and minute
- Key events (goals, red cards, penalties) with timestamps
- Shots and possession %

**Prompt goal:** Tell the story of the match so far, as a commentator would to a late arrival.

---

## Feature 3 — Turning Points

**Trigger:** Match transitions to FINISHED status.  
**Output:** 2–3 sentences, each describing a moment that decided the match.  
**Shown in:** Match detail page for finished matches, and in the `matchFinished` Socket.IO event.

**Context fed to the model:**
- Final score
- All goals, red cards, and penalties in chronological order with minute and player

**Prompt goal:** Analytical post-match breakdown of decisive moments.

---

## Feature 4 — Win Probability

**Method:** Pure math (no LLM). Calculated by `AIService.calculateWinProbability()` on every poll tick.

**Inputs and weights:**

| Signal | Weight |
|---|---|
| Score differential | ±22 per goal |
| Momentum score | ×0.18 |
| xG differential | ×8 |
| Shots on target differential | ×2 |
| Time elapsed (minute/90) | Multiplies score weight — leads matter more late |
| Red cards | ±20 per card |

Base probabilities: home 40%, draw 25%, away 35% (slight home advantage).  
All values clamped and normalized to sum to 100%.

**Special cases:**
- `NOT_STARTED` → 40 / 25 / 35
- `FINISHED` with a winner → 93 / 5 / 2 (or reversed)
- `FINISHED` draw → 10 / 80 / 10

---

## Feature 5 — Hot Feed AI Text

**Trigger:** `/hot` endpoint is called. Background enrichment runs async for next request.

**Per event type:**
- `GOAL` — one punchy sentence about the goal (max 20 words)
- `RED_CARD` — one sentence about the dismissal
- `YELLOW_CARD` — brief booking note
- `FULLTIME` — 2-sentence match result post

**Caching:** Results are stored in `aiTextCache` (in-memory `Map`). First call returns a rule-based fallback immediately; Groq enriches it in the background so the next call gets AI text.

---

## Feature 6 — World Cup AI Chat (Moments page)

**Model:** Same Groq endpoint via `/ai/chat` backend route.  
**System context:** Hard-coded facts about the 2026 World Cup (results, records, upsets, controversies).  
**Conversation history:** Last 4 messages passed as context.  
**Scope guard:** Refuses off-topic questions — "I only cover the 2026 World Cup."

**Client-side fallback:** If the backend is unreachable, the frontend has keyword-matching fallbacks for Messi, Ronaldo, Mbappé, Spain, Argentina, upsets, and VAR questions.

---

## Groq Rate Limits

Groq's free tier allows ~30 requests/minute on `llama-3.3-70b-versatile`. Pulse manages this by:
- Caching AI text per match per minute (keyed on `matchId-minute`)
- Only generating for score changes or 5-minute intervals (not every poll tick)
- Background async enrichment (never blocking the HTTP response)
- Graceful fallback to rule-based text on any error
