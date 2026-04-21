-- Supabase admin setup for secure highscore editing
-- Replace the placeholder email with your real admin email before running.
--
-- Run this in Supabase SQL Editor.

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
