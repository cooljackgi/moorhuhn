-- Moorhuhn admin + analytics setup
-- Run this in the Supabase SQL Editor.
-- Admin email fixed for this project: becker.bubenrod@gmail.com

alter table public.highscores enable row level security;

drop policy if exists "public can read highscores" on public.highscores;
drop policy if exists "public can insert highscores" on public.highscores;
drop policy if exists "admin can update highscores" on public.highscores;
drop policy if exists "admin can delete highscores" on public.highscores;

create policy "public can read highscores"
on public.highscores
for select
to anon, authenticated
using (true);

create policy "public can insert highscores"
on public.highscores
for insert
to anon, authenticated
with check (true);

create policy "admin can update highscores"
on public.highscores
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com')
with check ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com');

create policy "admin can delete highscores"
on public.highscores
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com');

create table if not exists public.game_config (
    key text primary key,
    value text not null
);

alter table public.game_config enable row level security;

drop policy if exists "public can read game config" on public.game_config;
drop policy if exists "admin can write game config" on public.game_config;

create policy "public can read game config"
on public.game_config
for select
to anon, authenticated
using (true);

create policy "admin can write game config"
on public.game_config
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com')
with check ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com');

insert into public.game_config (key, value)
values
    ('time_limit_seconds', '90'),
    ('game_enabled', 'true'),
    ('announcement_text', '')
on conflict (key) do nothing;

create table if not exists public.game_sessions (
    client_session_id text primary key,
    started_at timestamptz not null default timezone('utc', now()),
    ended_at timestamptz,
    completed boolean not null default false,
    score integer not null default 0,
    coins_earned integer not null default 0,
    duration_seconds integer not null default 0,
    exit_reason text not null default 'unknown',
    page_path text,
    user_agent text
);

alter table public.game_sessions enable row level security;

drop policy if exists "public can insert sessions" on public.game_sessions;
drop policy if exists "public can update sessions" on public.game_sessions;
drop policy if exists "admin can read sessions" on public.game_sessions;

create policy "public can insert sessions"
on public.game_sessions
for insert
to anon, authenticated
with check (true);

create policy "public can update sessions"
on public.game_sessions
for update
to anon, authenticated
using (true)
with check (true);

create policy "admin can read sessions"
on public.game_sessions
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'becker.bubenrod@gmail.com');
