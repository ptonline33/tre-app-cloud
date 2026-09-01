# TRE Practice App — Go Live Instructions

This deploys the cloud version in this folder to Vercel with Supabase as the
data store, so the app runs as an installable PWA on Android, Windows, and
Linux with data synced across devices.

Prerequisites installed on this machine: `node`, `vercel` CLI, `gh`, `git`.

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign in (email / Google / GitHub).
2. Click **New Project**.
3. Choose an organization (create one if prompted).
4. Project name: `tre-app`.
5. Set a strong database password and save it somewhere safe
   (the app never uses it, but the SQL editor does).
6. Region: pick one close to you (e.g. `us-east-1` or `eu-central-1`).
7. Plan: **Free**.
8. Wait 1–2 minutes for provisioning. You'll land on the project dashboard.

## 2. Create the `entries` table

1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase-schema.sql` (in this folder).
3. Click **Run**. Expect "Success" in the status bar.
4. Confirm the `entries` table exists under **Table Editor**.

`supabase-schema.sql` also enables Row Level Security. The default policy
("allow anon access") lets anyone with the anon key read/write everything.
Before sharing the app URL with anyone, replace it with the `X-App-Key`
policy shown as a comment in that file (details in step 4 below).

## 3. Point the app at Supabase

1. Left sidebar → **Project Settings** → **API**.
2. Copy the **Project URL** (e.g. `https://abcdefgh.supabase.co`).
3. Copy the **anon / public** key.
4. Edit `static/config.js` in this folder:

   ```js
   window.SUPABASE = {
     url: "https://<project-ref>.supabase.co",
     anon: "<anon-key>",
     table: "entries",
   };
   ```

## 4. (Recommended) Make the journal private

The anon key is public — it sits inside `config.js` and any visitor can read
it. For a private journal:

1. Pick a long random string and put it in `static/api.js` headers:

   ```js
   function sbHeaders(extra) {
     return Object.assign(
       {
         apikey: SB.anon,
         Authorization: "Bearer " + SB.anon,
         "Content-Type": "application/json",
         "X-App-Key": "YOUR-SECRET",
       },
       extra || {}
     );
   }
   ```

2. In Supabase SQL Editor, disable the permissive policy and enable the
   key-checking one (both are commented in `supabase-schema.sql`):

   ```sql
   drop policy "allow anon access" on public.entries;

   create policy "app key required" on public.entries
     for all to anon
     using (
       coalesce(
         nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
         ''
       ) = 'YOUR-SECRET'
     )
     with check (
       coalesce(
         nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
         ''
       ) = 'YOUR-SECRET'
     );
   ```

   Replace `YOUR-SECRET` with the same value in both places and in `api.js`.

## 5. Deploy to Vercel

From this folder:

```bash
cd /home/ptalwar/tre-app-cloud
vercel          # first time: asks to log in, link/create a project
vercel --prod   # deploy to production
```

Notes:

- `vercel` will prompt whether this is the project folder — accept the
  defaults; no framework/build is needed (pure static).
- Every later `vercel --prod` (or `git push` to a connected repo) deploys.
- You get an HTTPS URL like `https://tre-app-xxx.vercel.app` — PWA install
  works from there.

## 6. Move your existing data

On the local app (http://127.0.0.1:8432, still running):

1. **Stats** tab → **Download backup** → saves `tre-practice-backup-*.json`.
2. Open the deployed Vercel URL on any device → **Stats** tab → **Import
   backup** → pick that file.

The entries are now stored in Supabase and shared by every device.

## 7. Install the PWA

- **Android**: Chrome → open the app URL → menu → "Add to Home screen"
  (or the install prompt that appears).
- **Windows / Linux**: Chrome/Edge → open the URL → the install icon in the
  address bar → "Install".
- The app also works in offline mode for previously opened days (service
  worker cache), though live save/load needs a connection because data lives
  in Supabase.

---

## Troubleshooting

- **"Cannot reach Supabase"** — `config.js` URL/key missing or wrong, or the
  project region is unreachable. Double-check `static/config.js`.
- **Supabase error 401/403 (RLS)** — policies not created, or the `X-App-Key`
  header doesn't match the policy. Re-run the SQL from `supabase-schema.sql`
  (or the private policy above).
- **Old page / service worker** — hard refresh; the service worker cache was
  versioned (`tre-app-cloud-v1`) so it updates on new deploys.

## Repo reference

- `index.html` — app page (at repo root so Vercel serves it at `/`).
- `static/api.js` — Supabase REST client (replaces local `server.py` API).
- `static/config.js` — your Supabase URL / anon key (private if you use the
  `X-App-Key` policy, but never put a real secret here that you'd commit).
- `static/app.js`, `static/exercises.js`, `static/style.css` — unchanged from
  the local app, minus the built-in `api()`/`API` (now from `api.js`).
- `static/sw.js` — service worker (PWA + offline cache).
- `vercel.json` — cache + manifest headers.
- `supabase-schema.sql` — table + RLS setup.