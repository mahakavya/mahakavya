create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "owner_read" on push_subscriptions
  for select using (user_id = auth.uid());

create policy "owner_write" on push_subscriptions
  for insert with check (user_id = auth.uid());

create policy "owner_delete" on push_subscriptions
  for delete using (user_id = auth.uid());
