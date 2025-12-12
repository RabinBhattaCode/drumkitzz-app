-- Add optional backdrop image URL for profiles
alter table public.profiles
  add column if not exists backdrop_url text;

comment on column public.profiles.backdrop_url is 'Public URL for the user profile backdrop/cover image';
