# TRE Practice App — Change Log

Project: **tre-app-cloud** — the cloud (Vercel + Supabase) version of the TRE
Practice app. A journaling / practice app for TRE (Tension & Trauma Releasing
Exercises), Meditation, and Qi Gong. Supports per-session journal entries,
stats, history, and backup/restore.

This file logs fixes and notable changes with a plain-English
("layman") description alongside the technical detail. Newest first.

---

## 2026-09-24 — Timers drift/pause when the screen dims; dashboard days can show out of order

### Layman description

Some of my practice timers counted "number of screen refreshes" instead of
actual seconds, so when the phone screen dimmed or the app was in the
background, the timer would slow down or stop while real time kept moving.
Timers now measure real time and also ask the phone to keep the screen awake
during practice. Separately, the "recent activity" days on the dashboard
could occasionally show in the wrong order because the sort used the
browser's language rules; it now sorts by date directly.

### What was actually happening (technical)

- TRE, Qi Gong, and Meditation timers all counted `setInterval` ticks
  (`timerElapsed++`, `qgElapsed++`, `medProgress.remaining--`). Browsers
  throttle/suspend timers when the tab is hidden or the screen dims, so the
  count lost real time. Meditation also relied on a 1s tick for its bell/mood
  reminders.
- The dashboard's `renderDashRecent` sorted day blocks via
  `String(b.date).localeCompare(...)`, whose ordering depends on the browser
  locale and can disagree with chronological order for `YYYY-MM-DD` strings.

### Fixes applied

1. Wall-clock timers: all three timers now derive elapsed/remaining time from
   `Date.now()`:
   - TRE: added `timerRunStart` + `timerElapsedNow()`, 500ms tick that re-reads
     wall clock (`static/app.js`); pause snapshots elapsed, resume continues.
   - Qi Gong: same pattern with `qgRunStart`/`qgElapsedNow()`.
   - Meditation: running phase counts down from `endAt = now + total*1000`;
     settle phase from `settleEndAt`. Pause/resume store/skip via wall clock.
     250ms display tick; bells/mood ticks fire only when the whole-second value
     changes (guarded by `medProgress.lastTickRem`) so they ring once per second.
2. Screen wake lock: `syncWakeLock()` acquires `navigator.wakeLock.request("screen")`
   while any timer runs and releases when idle; `resyncActiveTimers()` recomputes
   displays and re-acquires wake lock on `visibilitychange` → visible.
3. Locale-independent date sort: `byDateDesc()` compares `YYYY-MM-DD` lexically
   (chronological, no locale dependency); used by `sortedSessionsNewest` and
   `renderDashRecent`.
4. Bumped service worker cache `v4` → `v5` in `static/sw.js` so installed
   clients pull the new code.

### Verification

- `node --check` passes on `static/app.js`, `static/api.js`, `static/sw.js`.
- Wall-clock math simulation: start 2s → pause → holds; resume +1s → totals 3s.
- `renderDashRecent` order against live Supabase data (19 journal_entries):
  24, 23, 22, 21 Sep (correct, newest first).

---

## 2026-09-22 — Journal save error: "Could not find the 'category' column of 'entries'"

### Layman description

When saving a journal entry the app said: "Could not find the category column
of entries". It meant the app was trying to file a journal entry into the wrong
drawer — a drawer that didn't have the "category" slot. The right drawer
(`journal_entries`) did have it all along. We pointed the app at the correct
drawer and it works now.

### What was actually happening (technical)

The journal save code built its data correctly (including `category`) but the
request forgot to say WHICH table to write to, so it defaulted to the old
`entries` table. That table has no `category` column, so Supabase/PostgREST
rejected it.

### Fixes applied (oldest → newest)

1. `907a7ee` — reload the PostgREST schema cache
   - Files: `supabase-schema.sql`, `GO_LIVE.md`
   - Why: first hypothesis was PostgREST serving a stale database schema.
     Added `notify pgrst, 'reload schema';` so re-running the schema file
     force-refreshes it, plus a troubleshooting entry.
   - Layman: we suspected Supabase was working from an old photo of the
     database, so we made it retake the photo.

2. `80e197e` — bump service worker cache `v3` → `v4`
   - Files: `static/sw.js`, `GO_LIVE.md`
   - Why: second hypothesis was a stale cached copy of the app in the
     device's service worker. Bumped the cache name so installed PWA clients
     fetch fresh files.
   - Layman: we suspected the phone/app kept using an old saved copy, so we
     forced it to download the latest copy.
   - Note: NOT the real cause. Kept here for the record.

3. `1a8af6a` — THE actual fix: send journal writes to `journal_entries`
   - Files: `static/api.js`
   - Why: the journal save (insert AND edit) and the backup-restore session
     writes were missing `base: SB_JOURNAL_REST`, so `category` payloads went
     to `/rest/v1/entries` and failed with
     `Could not find the 'category' column of 'entries' in the schema cache`.
   - Fixed: `base: SB_JOURNAL_REST` added at `static/api.js:248`, `:257`
     (journal save PATCH/POST) and `:302`, `:311` (restore session rows).
   - Verified: direct API tests to `/rest/v1/journal_entries` succeed; the
     fix is deployed to production.
   - Layman: pointed the app to the correct drawer for journal entries.