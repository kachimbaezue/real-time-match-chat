<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Changelog

### UI Polish — July 2026

**Sidebar (`src/components/AppLayout.tsx`)**
- Increased Pulse logo size from `h-7 w-7` to `h-9 w-9`; added the "Pulse" wordmark next to the logo when the sidebar is expanded
- Added a **"Built with"** collabs section above the Collapse button with two sponsor logos from `/public`:
  - `super-teamlogo.jpg` — Superteam logo (links to superteam.fun)
  - `txline-logo.svg` — TxLine logo (links to txline.io)
  - Both logos collapse to icon-only when the sidebar is in collapsed state

**Search (`src/components/AppLayout.tsx`)**
- The search icon in `TopBar` is now fully wired up with an `onClick` handler
- Clicking it opens a **Search Modal** that portals to `document.body`
- The modal:
  - Has a fixed search bar pinned to the top of the modal block (icon + input + ESC badge)
  - Input is auto-focused when the modal opens
  - Closes on `Escape` key or clicking the backdrop
  - Shows a football icon idle state when no query is typed
  - Displays live match results below — separated from the search bar by a border
  - Results are wider on desktop (max-w-2xl), centered, showing team names, flags, score, match status (LIVE/FT), and stage
  - Clicking a result navigates to the match page and closes the modal

**Match Pulse Card (`src/routes/match.$id.tsx`)**
- Replaced `FlashIcon` with `FootballIcon` (ball icon) for the Match Pulse section header — no more spark/flash icon anywhere in that context
- Completely redesigned the card:
  - Custom background with a subtle radial glow accent
  - Highlighted border using `color-mix`
  - Icon badge for the football icon (rounded square background)
  - Active pulse insight displayed large and prominent at `15–16px`
  - Non-active insights shown below as clickable dimmed text (click to jump)
  - Animated pill-dot progress indicators at the bottom — active dot expands to a pill shape
  - Live indicator dot when match is still in progress
