-- listeners fast lookups
create index if not exists idx_listeners_active on listeners(is_active);
create index if not exists idx_listeners_user on listeners(user_id);

-- slots uniqueness & range checks (prevent overlaps per listener)
create index if not exists idx_slots_listener_start on slots(listener_id, start_at);
create index if not exists idx_slots_listener_end on slots(listener_id, end_at);

-- sessions lookups
create index if not exists idx_sessions_listener on sessions(listener_id);
create index if not exists idx_sessions_seeker on sessions(seeker_id);
create index if not exists idx_sessions_status on sessions(status);

-- Add constraint to prevent slot overlaps for same listener
create or replace function check_slot_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from slots 
    where listener_id = NEW.listener_id 
    and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and (
      (NEW.start_at >= start_at and NEW.start_at < end_at) or
      (NEW.end_at > start_at and NEW.end_at <= end_at) or
      (NEW.start_at <= start_at and NEW.end_at >= end_at)
    )
  ) then
    raise exception 'Slot overlaps with existing slot for this listener';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trigger_check_slot_overlap on slots;
create trigger trigger_check_slot_overlap
  before insert or update on slots
  for each row execute function check_slot_overlap();
