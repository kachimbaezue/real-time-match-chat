# TxLINE API — Hackathon Feedback

## What Worked Well

**The `fixtures/snapshot` endpoint is excellent.** One call returns everything we need to bootstrap the entire match list. The `competitionId` filter made it trivial to scope to World Cup only. The schema is clean and consistent.

**Score events via `scores/snapshot/:fixtureId` are reliable.** The cumulative Stats keys (`"1"` and `"2"` for goals) proved to be the most trustworthy score source — more reliable than counting individual goal events, because the snapshot window can miss early-match events. Once we discovered this pattern (through terminal inspection), score accuracy was rock-solid.

**The `StatusId=100` game_finalised event is a great signal.** Knowing that the definitive end-of-match marker is a specific status ID made match lifecycle management clean. No ambiguity.

**Auth flow is straightforward.** Guest JWT + API token as two separate headers is easy to implement and reason about. The Solana on-chain activation is a novel approach and worked well for the free tier.

**The event schema is rich.** The `Possession` field, `PossessionType`, `Clock.Running`, and `Data` payload on shots give enough signal to build a meaningful momentum engine without needing any additional endpoints.

---

## Where We Hit Friction

**Finished fixtures fall off the snapshot.** The `fixtures/snapshot` endpoint only returns active fixtures. Once a match ends and drops off, there's no way to discover it from the snapshot alone. We had to hardcode known finished fixture IDs in `KNOWN_WC_FINISHED_FIXTURES` and bootstrap them directly from `scores/snapshot`. A `?includeFinished=true` query param, or a separate `fixtures/recent` endpoint covering the last 7 days, would solve this cleanly.

**Devnet vs mainnet diverge significantly.** The devnet (`txline-dev.txodds.com`) only exposes 2 fixtures and no historical data. We spent time debugging against devnet before realising the issue. Clearer documentation calling this out — or a devnet that mirrors the mainnet fixture set — would save builders hours.

**The Stats key map isn't documented.** We had to discover the numeric stat keys (`1`=P1 goals, `7`=P1 corners, `3001`=shots, etc.) by inspecting live terminal output. A stat key reference table in the docs would be extremely helpful.

**`Participant1` is sometimes a name, sometimes a team abbreviation.** Minor, but required defensive handling. More consistent name formatting would simplify flag/avatar lookups.

**The 3000-series stats keys were undocumented.** Keys like `3001` (shots), `3003` (shots on target), `3007`/`3008` (fouls) appeared in live data but aren't in the public docs. We used them and they worked, but it was a discovery-by-inspection process.

**No SSE/push for the free tier.** The free tier is polling-only (`fixtures/snapshot` + `scores/snapshot`). Server-Sent Events would allow truly real-time updates without the 10s poll overhead. Even a limited SSE feed for score changes on live fixtures would be a significant upgrade.

---

## Summary

Overall: TxLINE is genuinely good infrastructure. The data quality is high, the schema is well-designed, and the World Cup coverage is comprehensive. The friction points are all fixable with documentation improvements and a couple of additional endpoint options. For a hackathon product, it absolutely delivered.
