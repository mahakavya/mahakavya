-- Account deletion requests
create table if not exists delete_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  reason text,
  status text check (status in ('open','in_progress','completed','rejected')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_delete_requests_user on delete_requests(user_id);

alter table delete_requests enable row level security;

create policy "owner_read" on delete_requests 
  for select using (user_id = auth.uid());

create policy "owner_insert" on delete_requests 
  for insert with check (user_id = auth.uid());

-- Optional sequential doc numbers (year/month scoped counters)
create table if not exists doc_counters (
  id bigserial primary key,
  doc_type text not null,    -- 'invoice' | 'receipt'
  period text not null,      -- 'YYYYMM'
  counter int not null default 0,
  unique (doc_type, period)
);

-- RPC function for atomic counter increment
create or replace function doc_counter_inc(p_doc text, p_period text)
returns table(num int)
language plpgsql
security definer
as $$
begin
  -- Try to increment existing counter
  update doc_counters 
  set counter = counter + 1 
  where doc_type = p_doc and period = p_period;
  
  if found then
    return query select counter from doc_counters 
    where doc_type = p_doc and period = p_period;
  else
    -- Insert new counter starting at 1
    insert into doc_counters (doc_type, period, counter) 
    values (p_doc, p_period, 1);
    return query select 1 as num;
  end if;
end;
$$;
