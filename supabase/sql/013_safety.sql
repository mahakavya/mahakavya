create table if not exists safety_flags (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,        -- 'post' | 'reel' | 'comment'
  entity_id uuid not null,
  reason text not null,             -- 'profanity' | 'spam-link' | 'mass-mention' | ...
  score numeric not null,           -- 0..1
  status text check (status in ('open','reviewing','dismissed','actioned')) default 'open',
  created_by uuid,                  -- null => automated
  created_at timestamptz default now()
);

create index if not exists idx_safety_entity on safety_flags(entity_type, entity_id);
create index if not exists idx_safety_status on safety_flags(status);

alter table safety_flags enable row level security;

-- Admins only can read/write safety flags
create policy "safety_admin_read"
  on safety_flags for select
  using (exists(select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "safety_admin_write"
  on safety_flags for all
  using (exists(select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (true);
