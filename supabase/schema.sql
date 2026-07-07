-- Run this script in the Supabase SQL editor (Database → SQL editor)
-- to create the tables and row-level security policies used by the app.

create table if not exists public.saved_schemas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null,
  format text not null default 'yaml' check (format in ('json', 'yaml')),
  updated_at timestamptz not null default now()
);

alter table public.saved_schemas enable row level security;

create policy "Users can read their own schema"
  on public.saved_schemas for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schema"
  on public.saved_schemas for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schema"
  on public.saved_schemas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.request_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  method text not null,
  url text not null,
  status_code integer,
  duration_ms integer not null,
  request_size integer not null default 0,
  response_size integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

alter table public.request_history enable row level security;

create policy "Users can read their own history"
  on public.request_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own history"
  on public.request_history for insert
  with check (auth.uid() = user_id);

create index if not exists request_history_user_created_idx
  on public.request_history (user_id, created_at desc);
