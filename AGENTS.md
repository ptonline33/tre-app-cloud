# AGENTS.md — TRE Practice App (tre-app-cloud)

Project: cloud version of the TRE Practice app (Vercel + Supabase). Files live
at the repo root (`index.html`) and in `static/`.

## Working rules

- Whenever you fix a bug or shipping notable change, APPEND a dated entry to
  `CHANGELOG.md` (newest first), including:
  - Timestamp (date) and short headline.
  - A short layman/plain-English explanation of the problem and fix.
  - The technical details (root cause, files/line references, commit hash if any).
  - The verification performed.
- Keep `GO_LIVE.md` troubleshooting section in sync with any new failure the
  changelog documents.
- Only commit when the user asks. Commit messages: lowercase `fix:`/`Add:`
  prefix matching repo style.
- Verify against the live Supabase project (URL + anon key in
  `static/config.js`) and the deployed Vercel URL when debugging backend
  issues.