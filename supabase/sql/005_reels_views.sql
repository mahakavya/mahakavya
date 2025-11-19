-- Views tracking for Drishya reels
create table reel_views (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references reels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (reel_id, user_id)
);

-- Indexes for reel views
create index idx_reel_views_reel on reel_views(reel_id);
create index idx_reel_views_user on reel_views(user_id);
create index idx_reel_views_created on reel_views(created_at desc);

-- RLS policies for reel_views
alter table reel_views enable row level security;

-- Users can view their own views
create policy "Users can view own reel views" on reel_views
  for select using (auth.uid() = user_id);

-- Users can create views
create policy "Users can create reel views" on reel_views
  for insert with check (auth.uid() = user_id);

-- Admins can view all reel views
create policy "Admins can view all reel views" on reel_views
  for select using (is_admin(auth.uid()));

-- Function to toggle reel like (atomic operation)
create or replace function toggle_reel_like(reel_uuid uuid, user_uuid uuid)
returns json as $$
declare
  like_exists boolean;
  new_count integer;
begin
  -- Check if like exists
  select exists(
    select 1 from reel_likes 
    where reel_id = reel_uuid and user_id = user_uuid
  ) into like_exists;
  
  if like_exists then
    -- Remove like
    delete from reel_likes 
    where reel_id = reel_uuid and user_id = user_uuid;
    
    -- Update count
    update reels 
    set likes = likes - 1 
    where id = reel_uuid
    returning likes into new_count;
    
    return json_build_object('liked', false, 'count', new_count);
  else
    -- Add like
    insert into reel_likes (reel_id, user_id) 
    values (reel_uuid, user_uuid);
    
    -- Update count
    update reels 
    set likes = likes + 1 
    where id = reel_uuid
    returning likes into new_count;
    
    return json_build_object('liked', true, 'count', new_count);
  end if;
end;
$$ language plpgsql security definer;

-- Function to register reel view (idempotent)
create or replace function register_reel_view(reel_uuid uuid, user_uuid uuid)
returns json as $$
declare
  view_exists boolean;
  new_count integer;
begin
  -- Check if view already exists
  select exists(
    select 1 from reel_views 
    where reel_id = reel_uuid and user_id = user_uuid
  ) into view_exists;
  
  if not view_exists then
    -- Insert new view
    insert into reel_views (reel_id, user_id) 
    values (reel_uuid, user_uuid);
    
    -- Update view count
    update reels 
    set views = views + 1 
    where id = reel_uuid
    returning views into new_count;
    
    return json_build_object('viewed', true, 'count', new_count);
  else
    -- Return existing count
    select views into new_count from reels where id = reel_uuid;
    return json_build_object('viewed', false, 'count', new_count);
  end if;
end;
$$ language plpgsql security definer;
