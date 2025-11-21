-- Phase 0: Core schema for DrumKitzz
-- This migration creates the base tables + policies we need before wiring Supabase Auth, storage, and APIs.

create extension if not exists moddatetime schema extensions;

-- PROFILES ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure moddatetime (updated_at);

alter table public.profiles enable row level security;

create policy "profiles are viewable by authenticated users"
  on public.profiles for select
  using ((select auth.role()) = 'authenticated');

create policy "users can modify their own profile"
  on public.profiles for all
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- KIT PROJECTS ---------------------------------------------------------------
create type public.kit_status as enum ('draft', 'processing', 'ready', 'published', 'archived');
create type public.visibility_type as enum ('public', 'private');
create type public.kit_asset_type as enum ('original', 'chop', 'stem', 'preview', 'midi', 'other');

create table if not exists public.kit_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  source_audio_path text,
  source_duration numeric,
  slice_settings jsonb default '{}',
  playback_config jsonb default '{}',
  fx_chains jsonb default '{}',
  notes text,
  status kit_status default 'draft',
  linked_kit_id uuid,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger handle_projects_updated_at
  before update on public.kit_projects
  for each row
  execute procedure moddatetime (updated_at);

alter table public.kit_projects enable row level security;

create policy "project visible to owner"
  on public.kit_projects for select
  using (auth.uid() = owner_id);

create policy "project writable by owner"
  on public.kit_projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- KITS ----------------------------------------------------------------------
create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.kit_projects (id) on delete set null,
  name text not null,
  description text,
  cover_image_path text,
  bundle_path text,
  price_cents integer default 0,
  currency text default 'USD',
  visibility visibility_type default 'private',
  status kit_status default 'draft',
  download_count integer default 0,
  like_count integer default 0,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

alter table public.kit_projects
  add constraint kit_projects_linked_kit_fk
  foreign key (linked_kit_id) references public.kits (id) on delete set null;

create trigger handle_kits_updated_at
  before update on public.kits
  for each row
  execute procedure moddatetime (updated_at);

alter table public.kits enable row level security;

create policy "kits public readable"
  on public.kits for select
  using (visibility = 'public' or auth.uid() = owner_id);

create policy "kit owners can manage"
  on public.kits for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- KIT SLICES -----------------------------------------------------------------
create table if not exists public.kit_slices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.kit_projects (id) on delete cascade,
  kit_id uuid references public.kits (id) on delete cascade,
  name text,
  type text,
  start_time numeric not null,
  end_time numeric not null,
  fade_in_ms integer default 0,
  fade_out_ms integer default 0,
  metadata jsonb default '{}',
  created_at timestamptz default timezone('utc', now())
);

alter table public.kit_slices enable row level security;

create policy "slices readable by owner"
  on public.kit_slices for select
  using (
    exists (
      select 1
      from public.kit_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "slices writable by owner"
  on public.kit_slices for all
  using (
    exists (
      select 1
      from public.kit_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.kit_projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- KIT ASSETS -----------------------------------------------------------------
create table if not exists public.kit_assets (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  project_id uuid references public.kit_projects (id) on delete set null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  asset_type kit_asset_type default 'chop',
  storage_path text not null,
  duration_ms integer,
  size_bytes bigint,
  checksum text,
  metadata jsonb default '{}',
  created_at timestamptz default timezone('utc', now())
);

create index if not exists kit_assets_kit_idx on public.kit_assets (kit_id);
create index if not exists kit_assets_owner_idx on public.kit_assets (owner_id);

alter table public.kit_assets enable row level security;

create policy "assets readable by owner"
  on public.kit_assets for select
  using (auth.uid() = owner_id);

create policy "assets writable by owner"
  on public.kit_assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- USER STATS RPC -------------------------------------------------------------
create or replace function public.get_my_stats()
returns table (
  kits_count integer,
  projects_count integer,
  last_active_at timestamptz,
  total_kit_downloads bigint,
  latest_project_id uuid,
  latest_kit_id uuid
) security definer
set search_path = public
as $$
begin
  return query
  select
    (select count(*) from public.kits k where k.owner_id = auth.uid()) as kits_count,
    (select count(*) from public.kit_projects p where p.owner_id = auth.uid()) as projects_count,
    greatest(
      coalesce((select max(updated_at) from public.kit_projects p where p.owner_id = auth.uid()), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from public.kits k where k.owner_id = auth.uid()), 'epoch'::timestamptz)
    ) as last_active_at,
    (select coalesce(sum(download_count), 0) from public.kits k where k.owner_id = auth.uid()) as total_kit_downloads,
    (select id from public.kit_projects p where p.owner_id = auth.uid() order by p.updated_at desc limit 1) as latest_project_id,
    (select id from public.kits k where k.owner_id = auth.uid() order by k.updated_at desc limit 1) as latest_kit_id;
end;
$$ language plpgsql stable;

grant execute on function public.get_my_stats to authenticated;

-- PURCHASES -----------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null,
  currency text default 'USD',
  stripe_payment_id text,
  status text default 'pending',
  download_expires_at timestamptz,
  created_at timestamptz default timezone('utc', now())
);

alter table public.purchases enable row level security;

create policy "buyers can view own purchases"
  on public.purchases for select
  using (auth.uid() = buyer_id or auth.uid() = (select owner_id from public.kits where id = kit_id));

create policy "server inserts purchases"
  on public.purchases for insert
  with check (auth.role() = 'service_role');

-- FAVORITES -----------------------------------------------------------------
create table if not exists public.kit_likes (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  unique (kit_id, user_id)
);

alter table public.kit_likes enable row level security;

create policy "likes readable by authenticated users"
  on public.kit_likes for select
  using (auth.role() = 'authenticated');

create policy "users manage own likes"
  on public.kit_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTIFICATIONS -------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  type text not null,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default timezone('utc', now())
);

alter table public.notifications enable row level security;

create policy "notifications readable by owner"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications writable by owner"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "system inserts notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- AUDIT LOGS ----------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles (id),
  ip_address text,
  user_agent text,
  resource_type text,
  resource_id text,
  details jsonb,
  severity text default 'info',
  created_at timestamptz default timezone('utc', now())
);

alter table public.audit_logs enable row level security;

create policy "logs readable by admins"
  on public.audit_logs for select
  using (auth.jwt()->>'role' = 'admin');

create policy "service role inserts logs"
  on public.audit_logs for insert
  with check (auth.role() = 'service_role');
