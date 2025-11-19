-- Enhanced BhagyaChakra premium features

-- User preferences for RPA automation
create table if not exists user_preferences (
  user_id uuid references auth.users(id) on delete cascade,
  rpa_enabled boolean default false,
  rpa_level text default 'basic' check (rpa_level in ('basic', 'advanced', 'premium')),
  ai_insights_enabled boolean default true,
  blockchain_verification_enabled boolean default true,
  notification_preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- RPA automation jobs tracking
create table if not exists rpa_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_type text not null check (job_type in ('draw_analysis', 'entry_optimization', 'result_notification', 'draw_optimization')),
  status text default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  meta jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blockchain verification records
create table if not exists blockchain_records (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null,
  entity_id uuid,
  transaction_hash text,
  block_number bigint,
  status text default 'pending' check (status in ('pending', 'verified', 'failed')),
  verification_data jsonb,
  gas_used bigint,
  gas_price bigint,
  network text default 'ethereum',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enhanced draws table with premium features
alter table draws add column if not exists ai_enhanced boolean default false;
alter table draws add column if not exists blockchain_verified boolean default false;
alter table draws add column if not exists rpa_optimized boolean default false;
alter table draws add column if not exists premium_only boolean default false;

-- Draw analytics and insights
create table if not exists draw_analytics (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references draws(id) on delete cascade,
  total_views integer default 0,
  unique_viewers integer default 0,
  entry_conversion_rate decimal(5,2) default 0,
  share_count integer default 0,
  ai_success_prediction decimal(5,2),
  optimal_entry_time timestamptz,
  participant_demographics jsonb default '{}',
  engagement_metrics jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User draw insights and recommendations
create table if not exists user_draw_insights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  win_probability decimal(5,2) default 0,
  optimal_entry_times text[] default '{}',
  recommended_draws uuid[] default '{}',
  engagement_score integer default 0,
  ai_recommendations text[] default '{}',
  last_calculated timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_user_preferences_user_id on user_preferences(user_id);
create index if not exists idx_rpa_jobs_user_id on rpa_jobs(user_id);
create index if not exists idx_rpa_jobs_status on rpa_jobs(status);
create index if not exists idx_blockchain_records_entity on blockchain_records(entity_type, entity_id);
create index if not exists idx_draw_analytics_draw_id on draw_analytics(draw_id);
create index if not exists idx_user_draw_insights_user_id on user_draw_insights(user_id);

-- RLS policies
alter table user_preferences enable row level security;
alter table rpa_jobs enable row level security;
alter table blockchain_records enable row level security;
alter table draw_analytics enable row level security;
alter table user_draw_insights enable row level security;

-- User preferences policies
create policy "Users can view own preferences" on user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can update own preferences" on user_preferences
  for all using (auth.uid() = user_id);

-- RPA jobs policies
create policy "Users can view own RPA jobs" on rpa_jobs
  for select using (auth.uid() = user_id);

create policy "Users can create own RPA jobs" on rpa_jobs
  for insert with check (auth.uid() = user_id);

-- Blockchain records policies (read-only for users)
create policy "Users can view blockchain records" on blockchain_records
  for select using (true);

-- Draw analytics policies (read-only for users, admins can manage)
create policy "Users can view draw analytics" on draw_analytics
  for select using (true);

-- User draw insights policies
create policy "Users can view own insights" on user_draw_insights
  for select using (auth.uid() = user_id);

create policy "System can manage user insights" on user_draw_insights
  for all using (true);

-- Functions for premium features

-- Function to update draw analytics
create or replace function update_draw_analytics(
  p_draw_id uuid,
  p_view_increment integer default 1,
  p_unique_viewer boolean default false
)
returns void
language plpgsql
security definer
as $$
begin
  insert into draw_analytics (draw_id, total_views, unique_viewers)
  values (p_draw_id, p_view_increment, case when p_unique_viewer then 1 else 0 end)
  on conflict (draw_id) do update set
    total_views = draw_analytics.total_views + p_view_increment,
    unique_viewers = case 
      when p_unique_viewer then draw_analytics.unique_viewers + 1 
      else draw_analytics.unique_viewers 
    end,
    updated_at = now();
end;
$$;

-- Function to calculate user draw insights
create or replace function calculate_user_draw_insights(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_total_entries integer;
  v_wins integer;
  v_win_probability decimal(5,2);
  v_engagement_score integer;
begin
  -- Calculate user's draw statistics
  select count(*), count(case when d.result->>'winner_user_id' = p_user_id::text then 1 end)
  into v_total_entries, v_wins
  from entries e
  join draws d on e.draw_id = d.id
  where e.user_id = p_user_id;
  
  -- Calculate win probability
  v_win_probability := case 
    when v_total_entries > 0 then (v_wins::decimal / v_total_entries) * 100
    else 15.0 -- Default probability
  end;
  
  -- Calculate engagement score based on recent activity
  select count(*) * 10 into v_engagement_score
  from entries e
  where e.user_id = p_user_id
    and e.created_at > now() - interval '30 days';
  
  v_engagement_score := least(100, v_engagement_score);
  
  -- Update or insert user insights
  insert into user_draw_insights (
    user_id, 
    win_probability, 
    engagement_score,
    ai_recommendations,
    last_calculated
  )
  values (
    p_user_id,
    v_win_probability,
    v_engagement_score,
    array['Consider entering draws with fewer participants', 'Free draws have the same winning algorithm', 'Peak hours have higher participation'],
    now()
  )
  on conflict (user_id) do update set
    win_probability = v_win_probability,
    engagement_score = v_engagement_score,
    last_calculated = now(),
    updated_at = now();
end;
$$;

-- Trigger to update draw analytics on entry
create or replace function trigger_update_draw_analytics()
returns trigger
language plpgsql
as $$
begin
  perform update_draw_analytics(NEW.draw_id, 0, false);
  return NEW;
end;
$$;

create trigger update_draw_analytics_on_entry
  after insert on entries
  for each row
  execute function trigger_update_draw_analytics();

-- Sample data for premium features
insert into user_preferences (user_id, rpa_enabled, rpa_level, ai_insights_enabled)
select id, false, 'basic', true
from auth.users
where id not in (select user_id from user_preferences)
on conflict (user_id) do nothing;

-- Update existing draws to be premium-enhanced
update draws set 
  ai_enhanced = true,
  blockchain_verified = true,
  rpa_optimized = true,
  premium_only = true
where status in ('upcoming', 'closed');
