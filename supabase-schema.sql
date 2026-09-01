-- TRE Practice App — Supabase schema.
-- Run this in the Supabase SQL editor for your project.
--
-- IMPORTANT: quotes around every column name. Without them Postgres folds
-- names to lowercase, so "medMood" would become "medmood" and the app's
-- camelCase queries would fail. Keep the double quotes exactly as shown.

create table if not exists public.entries (
  "date"          text primary key,
  "mood"          text,
  "notes"         text    not null default '',
  "medMood"       text,
  "medNotes"      text    not null default '',
  "exercises"     jsonb   not null default '[]'::jsonb,
  "exerciseNotes" jsonb   not null default '{}'::jsonb,
  "minutes"       integer,
  "medMinutes"    integer,
  "meditations"   jsonb   not null default '[]'::jsonb
);

alter table public.entries enable row level security;

-- ---------------------------------------------------------------------------
-- Privacy policy.
--
-- The anon key ships publicly in static/config.js, so it is NOT a secret.
-- To stop casual access, api.js also sends an "X-App-Key" header whose value
-- must match APP_SECRET below. Set APP_SECRET to any long random string and
-- make sure static/config.js "appKey" uses the same value.
-- ---------------------------------------------------------------------------

drop policy if exists "allow anon access" on public.entries;
drop policy if exists "app key required" on public.entries;
create policy "app key required" on public.entries
  for all to anon
  using (
    coalesce(
      nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
      ''
    ) = 'ea2f1f556d8bd3d5c78876db95c17998a9425d5b082ab604'
  )
  with check (
    coalesce(
      nullif(current_setting('request.headers', true), '')::json->>'x-app-key',
      ''
    ) = 'ea2f1f556d8bd3d5c78876db95c17998a9425d5b082ab604'
  );

-- If you prefer NO privacy gate (personal trial / public journal), drop the
-- keyed policy above and uncomment the permissive one instead:
--
-- create policy "allow anon access" on public.entries
--   for all to anon
--   using (true)
--   with check (true);
