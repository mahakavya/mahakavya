create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  kind text not null,              -- 'message' | 'donation' | 'draw' | 'session' | 'system'
  title text not null,
  body text,
  href text,                       -- deep link for CTA
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where read_at is null;

create table if not exists notification_prefs (
  user_id uuid primary key references profiles(id) on delete cascade,
  email_digest boolean default true,
  push_enabled boolean default false,
  kinds_allowed text[] default array[]::text[]  -- empty = allow all
);

alter table notifications enable row level security;
alter table notification_prefs enable row level security;

create policy "notif_owner_read" on notifications
  for select using (user_id = auth.uid());

create policy "notif_owner_update" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "prefs_owner_rw" on notification_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
