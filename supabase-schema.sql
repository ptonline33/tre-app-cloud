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
  "meditations"   jsonb   not null default '[]'::jsonb,
  "qigongs"       jsonb   not null default '[]'::jsonb,
  "qgMood"        text,
  "qgMinutes"     integer,
  "qgNotes"       text    not null default ''
);

-- For projects already created from an older version of this schema, add the
-- newer column(s) without touching existing rows.
alter table public.entries add column if not exists "qigongs" jsonb not null default '[]'::jsonb;
alter table public.entries add column if not exists "qgMood" text;
alter table public.entries add column if not exists "qgMinutes" integer;
alter table public.entries add column if not exists "qgNotes" text not null default '';

alter table public.entries enable row level security;

-- ---------------------------------------------------------------------------
-- Per-session journal entries.
--
-- Each logged session gets its own row, so a second session on the same day
-- always becomes a brand-new journal entry instead of merging into the first
-- one. This applies to all categories (tre / med / qg) and is the table the
-- app reads/writes for everyday journaling.
-- ---------------------------------------------------------------------------

create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  "date"      text not null,
  "category"  text not null default 'tre',
  "createdAt" timestamptz not null default now(),
  "mood"      text,
  "minutes"   integer,
  "notes"     text not null default ''
);

create index if not exists journal_entries_date_idx on public.journal_entries ("date");
create index if not exists journal_entries_category_idx on public.journal_entries ("category");

alter table public.journal_entries enable row level security;

drop policy if exists "app key required" on public.journal_entries;
create policy "app key required" on public.journal_entries
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

-- ---------------------------------------------------------------------------
-- One-time migration of data recorded before this change.
--
-- The old `entries` table kept a single combined row per day with mood /
-- minutes / notes for every category. Historical rows are copied here (one
-- session per category per day, matching what could be recorded then) and a
-- flag column makes the migration idempotent so re-running this file does not
-- duplicate anything. The old columns are left untouched as a record; the app
-- now reads and writes journal_entries only.
-- ---------------------------------------------------------------------------

alter table public.entries add column if not exists "journalMigrated" boolean not null default false;

do $$
declare
  r record;
begin
  for r in
    select * from public.entries
    where "journalMigrated" = false
  loop
    if coalesce(r."mood", '') <> '' or coalesce(r."minutes", 0) > 0 or coalesce(r."notes", '') <> '' then
      insert into public.journal_entries ("date", "category", "createdAt", "mood", "minutes", "notes")
      values (r."date", 'tre', now(), r."mood", r."minutes", coalesce(r."notes", ''));
    end if;

    if coalesce(r."medMood", '') <> '' or coalesce(r."medMinutes", 0) > 0 or coalesce(r."medNotes", '') <> '' then
      insert into public.journal_entries ("date", "category", "createdAt", "mood", "minutes", "notes")
      values (r."date", 'med', now(), r."medMood", r."medMinutes", coalesce(r."medNotes", ''));
    end if;

    if coalesce(r."qgMood", '') <> '' or coalesce(r."qgMinutes", 0) > 0 or coalesce(r."qgNotes", '') <> '' then
      insert into public.journal_entries ("date", "category", "createdAt", "mood", "minutes", "notes")
      values (r."date", 'qg', now(), r."qgMood", r."qgMinutes", coalesce(r."qgNotes", ''));
    end if;

    update public.entries set "journalMigrated" = true where "date" = r."date";
  end loop;
end $$;

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
