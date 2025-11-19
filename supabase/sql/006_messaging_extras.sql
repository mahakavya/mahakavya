-- Improve messaging UX
alter table if exists conversation_members
  add column if not exists last_read_at timestamptz default now();

create index if not exists idx_conv_members_user on conversation_members(user_id);
create index if not exists idx_messages_conv_created on messages(conversation_id, created_at desc);

-- Add presence table for typing indicators and online status
create table if not exists presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  last_seen timestamptz default now(),
  is_typing boolean default false,
  conversation_id uuid references conversations(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, conversation_id)
);

create index if not exists idx_presence_user on presence(user_id);
create index if not exists idx_presence_conversation on presence(conversation_id);
create index if not exists idx_presence_last_seen on presence(last_seen desc);

-- RLS policies for presence
alter table presence enable row level security;

create policy "Users can view presence in their conversations"
  on presence for select
  using (
    exists (
      select 1 from conversation_members cm
      where cm.conversation_id = presence.conversation_id
      and cm.user_id = auth.uid()
    )
  );

create policy "Users can update their own presence"
  on presence for all
  using (user_id = auth.uid());

-- Function to update presence timestamp
create or replace function update_presence_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_presence_timestamp_trigger
  before update on presence
  for each row
  execute function update_presence_timestamp();
