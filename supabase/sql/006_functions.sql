-- Slot overlap prevention for Sahaya
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

create trigger trigger_check_slot_overlap
  before insert or update on slots
  for each row execute function check_slot_overlap();

-- Draw closing function
create or replace function close_draw(p_draw uuid, p_closed_at timestamptz)
returns void
language sql as $$
  update draws 
    set status = 'closed',
        result = coalesce(result, '{}'::jsonb) || jsonb_build_object('closed_at', p_closed_at)
  where id = p_draw and status = 'upcoming';
$$;

-- Campaign fundraising increment
create or replace function inc_campaign_raised(p_campaign uuid, p_amount int)
returns void
language sql as $$
  update campaigns set raised_amount = raised_amount + p_amount
  where id = p_campaign;
$$;

-- Document counter increment
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

-- Referral credits increment
create or replace function increment_referral_credits(p_user_id uuid, p_days int)
returns void
language sql
security definer
as $$
  insert into referral_credits (user_id, days, updated_at)
  values (p_user_id, p_days, now())
  on conflict (user_id) do update set
    days = referral_credits.days + p_days,
    updated_at = now();
$$;
