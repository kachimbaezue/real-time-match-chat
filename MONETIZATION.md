# Pulse — Monetization Playbook

> Built on TxLINE real-time data. Two days to submission. Here's what converts.

---

## The Core Thesis

Pulse sits at the intersection of **live sports data** (TxLINE) and **fan engagement**. 
Every monetization path below uses data we already have or can easily add. None require 
user accounts in v1 — they layer in progressively.

---

## Tier 1 — Zero-friction, ship now (hackathon window)

### 1. Prediction Banner (no backend needed)

On every live match page, above the stats:

```
┌──────────────────────────────────────────────┐
│  Who scores next?                            │
│  [🏠 England  43%] [Draw  21%] [🔴 ARG  36%] │
│  Powered by TxLINE win probability           │
└──────────────────────────────────────────────┘
```

- Data: already computed from `winProbability` in the engine
- Add an optional "lock in your pick" CTA that links to a partner sportsbook
- **Revenue model: affiliate CPA** — £20–£80 per depositing user

This is the lowest-friction path to revenue. We don't run the book; we send the click.

### 2. Sponsor skin on the Match Pulse card

The "Match Pulse" AI card already has the TxLINE/Superteam logo area.
The border, background glow, and "Built with" section are prime real estate for sponsors.

- A single sponsor slot per match page = one logo + one link
- "Powered by [Brand]" label on the pulse card
- **Revenue model: flat sponsorship per tournament** — $500–$5K for a WC final
- Immediate pitch: TxODDS themselves, a crypto exchange, a sports media brand

---

## Tier 2 — Ship within 1 week post-hackathon

### 3. Pulse Pro — Premium AI Insights

Free tier: 1 AI pulse per match, auto-refreshed.  
Pro tier ($4.99/month):
- Full turning-points narrative after each match
- Pre-match AI preview (team form, H2H, key players)
- "If you joined now" catch-up in <5 seconds
- Export match story as image card (shareable)

**Why it works**: Fans watching on the sofa don't want to dig through stats. 
They want a sentence that explains it. Groq/LLaMA gives us this at near-zero cost.

### 4. Group Sweepstake Tool

Inspired by the TxLINE hackathon prompt directly:
- User creates a group, invites friends, everyone gets randomly assigned a team
- Leaderboard updates live from TxLINE data — no spreadsheet needed
- Share link to join a group → viral loop built in
- **Revenue model**: premium groups ($2.99, unlimited members) vs free (max 8)

This is the most viral feature possible during a World Cup. 
Every share is a new acquisition event.

### 5. Embeddable Match Widget (B2B)

A single `<script>` tag that media publishers, blogs, and Discord bots can embed:

```html
<script src="https://pulse.app/widget.js" 
        data-match="18241006">
</script>
```

Renders a live score card + AI pulse + momentum bar.  
**Revenue model**: free for personal use, $29/month for commercial sites.

Target customers: football blogs (millions of pageviews), Discord communities, 
WhatsApp group bots, Telegram bots.

---

## Tier 3 — Medium-term product bets

### 6. TxLINE Odds Integration (already in the data feed)

TxLINE provides **consensus betting odds** in the same feed as match events.  
We can show:
- Pre-match odds (Next Goal Scorer, BTTS, Correct Score)
- In-play odds shifts as a "Odds Pulse" — "Argentina's odds to win just dropped from 1.8 to 1.4 after that red card"

**Revenue model**: 
- Affiliate links to regulated sportsbooks (UK, EU, Australia)
- Responsible gambling compliant — odds are information, not solicitation

This is the highest-revenue path if we expand beyond the hackathon.

### 7. Solana-native Fan Badges (on-chain)

Given we're on Superteam/Solana:
- Mint a free "I watched" NFT badge for each match a user views live
- Limited "Turning Point" NFTs for major moments (the Messi goal vs England, etc.)
- Data source: TxLINE event timestamps = verifiable on-chain truth

**Revenue model**: 
- 10% creator royalty on secondary sales
- Paid mints for special edition collectibles (World Cup Final badge: 0.1 SOL)

### 8. API Access for Developers

We are already a normalisation layer on top of TxLINE. 
Developers want a simpler API than raw TxLINE.

Offer:
- `GET /matches/live` — exactly what we already have
- `GET /hot` — curated hot moments feed
- WebSocket stream of match events

**Revenue model**: 
- Free: 100 requests/day
- Developer: $19/month — 10K requests/day
- Business: $99/month — unlimited + white-label

---

## TxLINE Endpoints We Use

| Endpoint | Purpose |
|---|---|
| `GET /api/fixtures/snapshot?competitionId=72` | All WC fixtures, game states |
| `GET /api/scores/snapshot/:fixtureId` | Full event history for a match |
| `GET /api/scores/historical/:fixtureId` | Completed match event log |
| `GET /api/scores/updates/:fixtureId` | (available) Live delta updates |

Odds endpoints (not yet used, high value):
| Endpoint | Purpose |
|---|---|
| `GET /api/odds/snapshot/:fixtureId` | Pre-match and in-play odds |
| `GET /api/odds/updates/:fixtureId` | Live odds movement |

---

## Judging Criteria Alignment

| Criterion | How we hit it |
|---|---|
| Fan Accessibility & UX | Hot Feed is Threads-style — zero learning curve |
| Real-Time Responsiveness | 10s live poll, Socket.IO push, AI pulse every 5 min |
| Originality | Hot Feed + AI narrative + Win Probability = nothing else does this |
| Commercial Path | Affiliate (ships now), Sweepstake (viral), B2B widget, odds |
| Completeness | Full E2E: TxLINE → backend → Socket.IO → frontend |

---

## Immediate Revenue Action (pre-submission)

1. Add a single affiliate CTA button to the live match page:  
   `"Bet on this match →"` → links to Bet365/DraftKings affiliate URL
2. Add the sponsor logo slot to the Match Pulse card (already styled, just swap the logo)
3. Ship the Group Sweepstake as a `/sweepstake` route — even if it's just a demo form

These three changes = a demo video that shows a clear commercial path.
