create table if not exists rate_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  ip text,
  route text not null,
  created_at timestamptz default now()
);

create index if not exists idx_rate_user_route on rate_events(user_id, route, created_at desc);
create index if not exists idx_rate_ip_route on rate_events(ip, route, created_at desc);

-- shadow-mute toggle
alter table if exists profiles
  add column if not exists shadow_muted boolean default false;

-- RLS (reads not required; inserts allowed to authed users; server/service role can always write)
alter table rate_events enable row level security;

do $$ begin
  create policy rate_insert_authed on rate_events
    for insert to authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;
