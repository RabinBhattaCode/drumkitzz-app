-- Phase 0 addendum: messaging system (threads + messages + requests)

create type public.message_request_status as enum ('pending', 'accepted', 'rejected');

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  is_group boolean default false,
  last_message_preview text,
  last_message_at timestamptz default timezone('utc', now()),
  created_at timestamptz default timezone('utc', now())
);
alter table public.message_threads enable row level security;

create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text default 'participant',
  joined_at timestamptz default timezone('utc', now()),
  unique (thread_id, user_id)
);
alter table public.thread_participants enable row level security;
create policy "participants readable by thread members"
  on public.thread_participants for select
  using (
    exists (
      select 1
      from public.thread_participants tp2
      where tp2.thread_id = thread_id and tp2.user_id = auth.uid()
    )
  );
create policy "users manage their participation"
  on public.thread_participants for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "threads visible to participants"
  on public.message_threads for select
  using (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = id and tp.user_id = auth.uid()
    )
  );

create policy "creators manage threads"
  on public.message_threads for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  attachments jsonb default '[]',
  is_deleted boolean default false,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  read_by uuid[] default '{}'
);

create trigger handle_messages_updated_at
  before update on public.messages
  for each row
  execute procedure moddatetime (updated_at);

alter table public.messages enable row level security;

create policy "messages readable by thread members"
  on public.messages for select
  using (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = thread_id and tp.user_id = auth.uid()
    )
  );

create policy "participants can send messages"
  on public.messages for insert
  with check (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = thread_id and tp.user_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

create policy "senders can soft delete"
  on public.messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create table if not exists public.message_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  status message_request_status default 'pending',
  thread_id uuid references public.message_threads (id) on delete set null,
  created_at timestamptz default timezone('utc', now()),
  unique (requester_id, target_id)
);

alter table public.message_requests enable row level security;

create policy "requests visible to involved users"
  on public.message_requests for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "requester can create"
  on public.message_requests for insert
  with check (auth.uid() = requester_id);

create policy "target can update status"
  on public.message_requests for update
  using (auth.uid() = target_id)
  with check (auth.uid() = target_id);
