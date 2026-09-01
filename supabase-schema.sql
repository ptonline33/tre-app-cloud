-- TRE Practice App — Supabase schema.
-- Run this in the Supabase SQL editor for your project.
-- It creates the `entries` table and enables Row Level Security.

create table if not exists public.entries (
  date          text primary key,
  mood          text,
  notes         text    not null default '',
  medMood       text,
  medNotes      text    not null default '',
  exercises     jsonb   not null default '[]'::jsonb,
  exerciseNotes jsonb   not null default '{}'::jsonb,
  minutes       integer,
  medMinutes    integer,
  meditations   jsonb   not null default '[]'::jsonb
);

alter table public.entries enable row level security;

-- ---------------------------------------------------------------------------
-- IMPORTANT: the anon key in static/config.js is public by design (it ships
-- inside the app JavaScript), so the policy below that lets anon users read
-- and write the whole table makes this journal visible to ANYONE who extracts
-- the anon key. That is fine for a quick personal trial, but for a genuinely
-- private journal replace the policy below with one that requires a secret
-- app key or real authentication.
--
-- Simple option — require a custom header sent by api.js:
--   create policy "app key required" on public.entries
--     for all to anon
--     using (
--       coalesce(
--         nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
--         ''
--       ) = 'YOUR-SECRET'
--     )
--     with check (
--       coalesce(
--         nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
--         ''
--       ) = 'YOUR-SECRET'
--     );
-- (and add "X-App-Key": "YOUR-SECRET" to the headers in static/api.js)
-- ---------------------------------------------------------------------------

create policy "allow anon access" on public.entries
  for all to anon
  using (true)
  with check (true);