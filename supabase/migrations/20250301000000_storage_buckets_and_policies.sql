-- Storage buckets and RLS for user-owned audio assets

-- Buckets (private by default)
insert into storage.buckets (id, name, public)
values 
  ('raw-audio', 'raw-audio', false),
  ('stems', 'stems', false),
  ('chops', 'chops', false)
on conflict (id) do nothing;

-- Bucket for public-ish images (covers). Keep controlled writes.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Helper: first path segment must equal auth.uid()
create or replace function public.storage_owner_matches(name text)
returns boolean
language sql
stable
as $$
  select split_part(name, '/', 1) = auth.uid()::text;
$$;

-- Raw / stems / chops: owner read/write only
create policy "raw objects readable by owner"
  on storage.objects for select
  using (
    bucket_id = 'raw-audio'
    and public.storage_owner_matches(name)
  );

create policy "stems readable by owner"
  on storage.objects for select
  using (
    bucket_id = 'stems'
    and public.storage_owner_matches(name)
  );

create policy "chops readable by owner"
  on storage.objects for select
  using (
    bucket_id = 'chops'
    and public.storage_owner_matches(name)
  );

create policy "raw objects writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'raw-audio'
    and public.storage_owner_matches(name)
  );

create policy "stems writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'stems'
    and public.storage_owner_matches(name)
  );

create policy "chops writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'chops'
    and public.storage_owner_matches(name)
  );

create policy "raw updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'raw-audio'
    and public.storage_owner_matches(name)
  )
  with check (
    bucket_id = 'raw-audio'
    and public.storage_owner_matches(name)
  );

create policy "stems updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'stems'
    and public.storage_owner_matches(name)
  )
  with check (
    bucket_id = 'stems'
    and public.storage_owner_matches(name)
  );

create policy "chops updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'chops'
    and public.storage_owner_matches(name)
  )
  with check (
    bucket_id = 'chops'
    and public.storage_owner_matches(name)
  );

create policy "raw delete by owner"
  on storage.objects for delete
  using (
    bucket_id = 'raw-audio'
    and public.storage_owner_matches(name)
  );

create policy "stems delete by owner"
  on storage.objects for delete
  using (
    bucket_id = 'stems'
    and public.storage_owner_matches(name)
  );

create policy "chops delete by owner"
  on storage.objects for delete
  using (
    bucket_id = 'chops'
    and public.storage_owner_matches(name)
  );

-- Covers: public read, authenticated write scoped to their prefix
create policy "covers readable by anyone"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "covers writable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and public.storage_owner_matches(name)
    and auth.role() = 'authenticated'
  );

create policy "covers update by owner"
  on storage.objects for update
  using (
    bucket_id = 'covers'
    and public.storage_owner_matches(name)
  )
  with check (
    bucket_id = 'covers'
    and public.storage_owner_matches(name)
  );

create policy "covers delete by owner"
  on storage.objects for delete
  using (
    bucket_id = 'covers'
    and public.storage_owner_matches(name)
  );
