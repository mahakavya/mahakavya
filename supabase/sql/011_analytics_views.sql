-- already have: events(id, user_id, name, props, created_at), audit_logs(...)

-- helpful indexes
create index if not exists idx_events_name_created on events(name, created_at);
create index if not exists idx_audit_created on audit_logs(created_at);

-- optional view for daily counts (IST)
create or replace view v_event_daily_ist as
select
  (created_at at time zone 'Asia/Kolkata')::date as day_ist,
  name,
  count(*) as cnt
from events
group by 1,2
order by 1 desc, 2;
