-- Recreate storage_owner_matches with a fixed search_path and schema-qualified references
create or replace function public.storage_owner_matches(name text)
returns boolean
language plpgsql
stable
as $$
declare
  owner text;
begin
  -- lock down name resolution to trusted schemas
  perform set_config('search_path', 'pg_catalog, public, auth', true);

  owner := split_part(name, '/', 1);
  return owner = auth.uid()::text;
end;
$$;
