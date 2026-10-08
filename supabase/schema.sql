-- Run once in the Supabase SQL editor (or `supabase db push`).
create table if not exists public.snapshots (
  id          text primary key,            -- unguessable 24-char token used in the share URL
  file_name   text not null,
  deal_count  integer not null,
  deals       jsonb not null,              -- normalised deal rows captured at share time
  created_at  timestamptz not null default now()
);

-- The app reads/writes only through server routes using the service-role key.
-- Enabling RLS with no policies blocks the public anon key from touching this table.
alter table public.snapshots enable row level security;
