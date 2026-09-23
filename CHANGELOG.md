# TRE Practice App — Change Log

Project: **tre-app-cloud** — the cloud (Vercel + Supabase) version of the TRE
Practice app. A journaling / practice app for TRE (Tension & Trauma Releasing
Exercises), Meditation, and Qi Gong. Supports per-session journal entries,
stats, history, and backup/restore.

This file logs fixes and notable changes with a plain-English
("layman") description alongside the technical detail. Newest first.

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