-- Follow system for Samvaaha feed
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id)
);

-- Indexes for follow queries
create index idx_follows_follower_id on follows(follower_id);
create index idx_follows_followee_id on follows(followee_id);
create index idx_follows_created_at on follows(created_at desc);

-- RLS policies for follows
alter table follows enable row level security;

-- Users can view follows they're involved in
create policy "Users can view own follows" on follows
  for select using (
    auth.uid() = follower_id or auth.uid() = followee_id
  );

-- Users can follow others
create policy "Users can follow others" on follows
  for insert with check (auth.uid() = follower_id);

-- Users can unfollow
create policy "Users can unfollow" on follows
  for delete using (auth.uid() = follower_id);

-- Admins can view all follows
create policy "Admins can view all follows" on follows
  for select using (is_admin(auth.uid()));

-- Add follower/following counts to profiles (optional materialized view)
create or replace view profile_stats as
select 
  p.id,
  p.name,
  p.avatar_url,
  coalesce(follower_counts.count, 0) as followers_count,
  coalesce(following_counts.count, 0) as following_count
from profiles p
left join (
  select followee_id, count(*) as count
  from follows
  group by followee_id
) follower_counts on p.id = follower_counts.followee_id
left join (
  select follower_id, count(*) as count
  from follows
  group by follower_id
) following_counts on p.id = following_counts.follower_id;

-- Function to check if user A follows user B
create or replace function is_following(follower_uuid uuid, followee_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from follows 
    where follower_id = follower_uuid and followee_id = followee_uuid
  );
end;
$$ language plpgsql security definer;

-- RPC function to toggle like (atomic operation)
create or replace function toggle_post_like(post_uuid uuid, user_uuid uuid)
returns json as $$
declare
  like_exists boolean;
  new_count integer;
begin
  -- Check if like exists
  select exists(
    select 1 from post_likes 
    where post_id = post_uuid and user_id = user_uuid
  ) into like_exists;
  
  if like_exists then
    -- Remove like
    delete from post_likes 
    where post_id = post_uuid and user_id = user_uuid;
    
    -- Update count
    update posts 
    set like_count = like_count - 1 
    where id = post_uuid
    returning like_count into new_count;
    
    return json_build_object('liked', false, 'count', new_count);
  else
    -- Add like
    insert into post_likes (post_id, user_id) 
    values (post_uuid, user_uuid);
    
    -- Update count
    update posts 
    set like_count = like_count + 1 
    where id = post_uuid
    returning like_count into new_count;
    
    return json_build_object('liked', true, 'count', new_count);
  end if;
end;
$$ language plpgsql security definer;
