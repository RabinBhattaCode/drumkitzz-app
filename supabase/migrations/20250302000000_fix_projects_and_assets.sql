-- Ensure columns exist on kit_projects
alter table if exists public.kit_projects
  add column if not exists playback_config jsonb default '{}'::jsonb;

alter table if exists public.kit_projects
  add column if not exists fx_chains jsonb default '{}'::jsonb;

alter table if exists public.kit_projects
  add column if not exists notes text;

-- Ensure enum type exists
do $$
begin
  if not exists (select 1 from pg_type where typname = 'kit_asset_type') then
    create type public.kit_asset_type as enum ('original', 'chop', 'stem', 'preview', 'midi', 'other');
  end if;
end
$$;

-- Ensure kit_assets table exists
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

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'kit_assets' and policyname = 'assets readable by owner') then
    create policy "assets readable by owner"
      on public.kit_assets for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'kit_assets' and policyname = 'assets writable by owner') then
    create policy "assets writable by owner"
      on public.kit_assets for all
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end
$$;
