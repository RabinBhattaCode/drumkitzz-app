-- Phase 0 addendum: follow system tables/policies

create table if not exists public.profile_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.profile_follows enable row level security;

create policy "follow graph readable by authenticated users"
  on public.profile_follows for select
  using (auth.role() = 'authenticated');

create policy "users can follow others"
  on public.profile_follows for insert
  with check (auth.uid() = follower_id);

create policy "users can unfollow themselves"
  on public.profile_follows for delete
  using (auth.uid() = follower_id);
