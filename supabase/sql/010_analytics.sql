-- Analytics views and indexes
create index idx_events_name_created on events(name, created_at);
create index idx_audit_created on audit_logs(created_at);

-- Daily events view (IST timezone)
create or replace view v_event_daily_ist as
select
  (created_at at time zone 'Asia/Kolkata')::date as day_ist,
  name,
  count(*) as cnt
from events
group by 1,2
order by 1 desc, 2;
