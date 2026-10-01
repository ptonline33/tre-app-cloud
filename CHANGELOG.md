# TRE Practice App — Change Log

Project: **tre-app-cloud** — the cloud (Vercel + Supabase) version of the TRE
Practice app. A journaling / practice app for TRE (Tension & Trauma Releasing
Exercises), Meditation, and Qi Gong. Supports per-session journal entries,
stats, history, and backup/restore.

This file logs fixes and notable changes with a plain-English
("layman") description alongside the technical detail. Newest first.

---

## 2026-10-01 — Soft interval bell and ending bell silent on a dimmed or locked phone

### Layman description

The 5-minute soft bell and the end-of-sit bell still went silent once the phone
screen dimmed or the phone locked, even though the previous fix made the bells
"wall-clock accurate". The trouble: the bells were still only *rung* from inside
the little 250ms countdown tick — so whenever the browser froze that tick (which
is exactly what a dimmed or locked screen does), the bell code never ran at all.
Now the bells are booked in advance on the phone's *sound clock* the moment the
sit starts, like setting an alarm that doesn't need the app awake: even with no
JS running at all, the sound hardware rings at 5/10/15 minutes and at the end.
The app also now keeps itself counted as "playing audio" (a silent loop through
a real audio element) so the browser won't freeze the tab the way it used to.

### What was actually happening (technical)

Even after the 2026-09-27 fix, `syncIntervalBell()` was still only invoked from
the 250ms `setInterval` tick in `beginRunningPhase()`/`resumeMeditation()`. When
the screen dims or the phone locks, Chromium throttles background tabs to about
1 tick/minute and suspends them entirely when locked, so the tick either never
ran near a boundary or never ran at all — no bell, and no ending bell either
(`finishMeditation()` also only ran from that tick). The wall-clock `bellIndex`
counting fixed *timing*, not *delivery*: a bell whose ring moment passed while
no tick ran was simply never sounded.

Additionally, the audio keep-alive used a gain-0 oscillator connected straight
to `audioCtx.destination` — Chromium still suspended that context as "idle",
freezing the whole Web Audio graph.

### Fixes applied (`static/app.js`, `static/sw.js`)

1. **Pre-scheduled bells on the Web Audio clock.** New `scheduleMeditationBells()`
   runs when the running phase begins (`beginRunningPhase()`) and resumes
   (`resumeMeditation()`), and asks the audio clock (`AudioContext.currentTime`)
   to play each future interval bell and the ending bell at its exact time
   (`ctx.currentTime + (wallMs - now)/1000`). Because the audio clock advances in
   real time as long as the context is alive, the bells ring on time even with
   zero JS running. The 250ms tick's `syncIntervalBell()` is now only a fallback
   (it rings when the context is suspended and the scheduled bells are frozen),
   and it no longer double-rings when the audio-clock bells are in charge
   (`if (medProgress.bellsScheduled && audioCtx.state === "running") return`).
2. **Silent media keep-alive.** `startAudioKeepAlive()` now routes the silent
   tone through `audioCtx.createMediaStreamDestination()` into a real `<audio>`
   element (`media.srcObject = dest.stream; media.play()`), so the tab counts as
   actively playing audio and the OS/browser won't throttle or suspend it — which
   is what keeps the audio clock, and therefore the pre-scheduled bells, running
   through a dimmed or locked screen. Falls back to the old direct-destination
   connection if MediaStream routing is unavailable.
3. **Lifecycle hygiene.** `pauseMeditation()`, `endMeditation()`, `resetMeditation()`
   call `cancelScheduledBells()` so a cancelled/paused sit never rings bells it
   booked for the future. `resyncActiveTimers()` (visible again) re-arms the
   schedule for what's left. `finishMeditation()` checks `endingBellAudioTime`
   against the live context to decide whether the ending bell already rang and
   only rings it live if the audio context was frozen at the end.
4. **Mid-sit toggling.** Toggling the "Soft interval bell" checkbox mid-sit
   re-arms (or cancels) the pre-scheduled bells.
5. Bumped the service worker cache `v6` → `v7` in `static/sw.js` so installed
   PWAs pull the new code.

### Verification

- `node --check` passes on `static/app.js` and `static/sw.js`.
- Extracted the real `scheduleMeditationBells`/`syncIntervalBell`/`syncBellIndex`/
  `cancelScheduledBells` source from `static/app.js` (not a copy) and drove it
  with a simulated wall clock + fake AudioContext — 18/18 checks pass: a 20-min
  sit books bells at 5/10/15 min + ending at 20; a 10-min sit books the 5-min
  soft bell + ending; resume mid-window skips the already-past boundary; the tick
  does not double-ring when the audio clock is in charge; a suspended context
  makes the tick fallback ring once; the option off books only the ending bell;
  pause cancels booked bells; the ending-bell "did it ring?" decision is true for
  a running context and false for a frozen one.
- Not verifiable from here: real audibility on a physical phone with the screen
  locked. If a bell is still missed, check the phone's battery saver / "app
  hibernation" (Samsung/Xiaomi/iOS Low Power) is not force-killing the tab — no
  web page can override an OS-level freeze, and that is the one remaining cause.

---

### Layman description

With "Soft interval bell every 5 minutes" ticked, the chime stopped turning up
after the phone's screen dimmed — a 20-minute sit would ring two bells instead
of three, or none at all. The bell is no longer tied to the little timer tick
that draws the countdown, so a dimmed (or briefly backgrounded) screen can't
skip it. The app also keeps the phone's sound engine awake for the length of a
practice session, and puts the screen back on the "keep awake" list if the
phone drops it. A pause/resume still won't fire a bell, and the bell at the very
end of the sit is still the longer ending chime, not the soft one.

### What was actually happening (technical)

Three separate things had to line up for a bell to be heard, and all three broke
when the screen dimmed:

1. **The bell was only a coincidence of timing** (`static/app.js`, both
   `beginRunningPhase()` and `resumeMeditation()`):
   `if (intervalMin && rem > 0 && rem % intervalMin === 0) playBell(0.5)`.
   `rem` is `ceil((endAt - now)/1000)`, so the bell rang only if one of the
   250 ms ticks happened to land inside the single second where `rem` was
   exactly a multiple of 300. Browsers throttle or suspend timers once the page
   is occluded/backgrounded, so a stall that straddled a 5-minute boundary
   skipped that second entirely and the bell was lost with no trace. Simulated:
   a 2–9 minute stall gives the old code 2 of 3 bells, the new code 3 of 3.
2. **The audio context was suspended.** `ensureAudio()` called
   `ctx.resume()` but never waited for it, so bells were scheduled against a
   context whose `currentTime` was frozen; when the OS had suspended the context
   because the page was no longer foregrounded, the ring was silently dropped.
3. **The screen wake lock was never re-armed.** The `release` handler only
   nulled the sentinel. A screen *dim* fires no `visibilitychange` (only a
   background/unbackground does), so the lock was gone for the rest of the sit:
   the page then got throttled and backgrounded, feeding problems 1 and 2.

### Fixes applied (`static/app.js`)

- **Wall-clock interval bells**: new `MED_BELL_SEC` (5 min),
  `syncIntervalBell(now, rem)` and `syncBellIndex()`, with
  `medProgress.bellIndex` counting boundaries already rung
  (`due = floor((now - startAt) / 5min)`). Any boundary that passed while the
  tick was stalled rings **once** — never a burst — and the next bell is back on
  the original cadence. `resyncActiveTimers()` counts off boundaries missed
  while backgrounded silently, so there's no bell storm when you pick the phone
  up. The fragile `rem % intervalMin === 0` check and its `lastTotal` guard are
  gone from both tick loops.
- **Audio keep-alive**: `startAudioKeepAlive()` runs a gain-0 oscillator for the
  length of a session (`stopAudioKeepAlive()` tears it down), so the context
  isn't suspended for being idle while the screen dims. `syncAudioKeepAlive()`
  follows `activeTimerRunning()`; it is a no-op when no context exists yet, so
  the TRE/Qi Gong timers (which make no sound) don't spin one up.
- **`runningCtx()`**: `playBell`/`playEndingBell`/`playTick` are now async and
  `await` a `resume()` before scheduling, and bail out (rather than queue into a
  dead context) if the OS refuses.
- **Wake lock re-arm**: `rearmWakeLock()` retries the request up to 4 times at
  1.5 s while a session runs and the page is visible; `wakeLockAttempts` resets
  on a successful request and the retry timer is cleared on release. Bounded on
  purpose — after 4 attempts the screen is left alone so a deliberate
  screen-off still wins.
- **One switch for both**: `syncSessionKeepAwake()` (wake lock + audio
  keep-alive) replaces all 16 bare `syncWakeLock()` call sites, so no timer
  start/stop path can miss one of the two.
- Bumped the service worker cache `v5` → `v6` in `static/sw.js` so installed
  PWAs pull the new code.

### Verification

- `node --check` passes on `static/app.js` and `static/sw.js`.
- Bell logic tested against the **real** `syncIntervalBell`/`syncBellIndex`
  source extracted from `static/app.js` (not a copy) with a simulated clock and
  the same 250 ms cadence as the app — 13/13 checks pass: bells at 5/10/15 min of
  a 20-min sit; a 10-min sit rings once (5 min) and leaves the end to the ending
  bell; a 6-minute tick stall (3→9 min) still rings 3 of 3 where the old
  condition rings 2; a 1-minute stall straddling a boundary rings once, not a
  burst; nothing rings at `rem === 0`; resume doesn't ring immediately and the
  cadence continues at 10/15; the option off rings nothing; a paused sit is
  silent.
- Old-vs-new comparison across stall patterns (2/6/7/9-minute stalls, stalls
  starting mid-sit): old 2 of 3 bells, new 3 of 3.
- Not verifiable from here: real audibility on a physical phone (needs a dimmed
  screen + speaker). If a bell is still missed, check that the sit was started
  from the app (the first tap is what unlocks audio on iOS) and that the phone's
  battery saver isn't force-suspending the tab.

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