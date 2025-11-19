-- DRISHYA (REELS) SCHEMA
-- Complete database schema for vertical short-video experience

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- REELS table
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  caption text,
  tags text[] default '{}',
  audio_title text,
  audio_url text,                               -- optional, from drishya-audio
  upload_path text not null,                    -- storage path in drishya-uploads
  hls_url text,                                 -- final playable m3u8 (drishya-stream)
  thumb_url text,                               -- poster image (drishya-thumbs)
  duration_seconds int check (duration_seconds >= 0),
  width int, 
  height int,
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','FOLLOWERS','PRIVATE')),
  status text not null default 'PROCESSING' check (status in ('PROCESSING','READY','FAILED')),
  like_count int not null default 0,
  comment_count int not null default 0,
  share_count int not null default 0,
  view_count int not null default 0,
  completion_rate numeric(5,2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- REEL LIKES
create table if not exists public.reel_likes (
  reel_id uuid references public.reels(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

-- REEL BOOKMARKS
create table if not exists public.reel_bookmarks (
  reel_id uuid references public.reels(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

-- REEL COMMENTS
create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  body text not null,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

-- REEL COMMENT LIKES
create table if not exists public.reel_comment_likes (
  comment_id uuid references public.reel_comments(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- REEL VIEWS (unique per user per reel per day to avoid abuse)
create table if not exists public.reel_views (
  reel_id uuid references public.reels(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  watched_seconds int not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id, created_at::date)
);

-- Enable RLS
alter table public.reels enable row level security;
alter table public.reel_likes enable row level security;
alter table public.reel_bookmarks enable row level security;
alter table public.reel_comments enable row level security;
alter table public.reel_comment_likes enable row level security;
alter table public.reel_views enable row level security;

-- Helper function to check if user can view reel based on visibility
create or replace function public.can_view_reel(r public.reels, uid uuid)
returns boolean language sql stable as $$
  select case
    when r.visibility = 'PUBLIC' then true
    when r.visibility = 'PRIVATE' then r.author_id = uid
    when r.visibility = 'FOLLOWERS' then (r.author_id = uid) or exists(
      select 1 from public.follows where follower_id = uid and followee_id = r.author_id
    )
    else false
  end;
$$;

-- RLS Policies

-- REELS policies
create policy "reels: insert by author" on public.reels
for insert to authenticated with check (author_id = auth.uid());

create policy "reels: update/delete by author" on public.reels
for update, delete to authenticated using (author_id = auth.uid());

create policy "reels: read by visibility" on public.reels
for select to authenticated using (public.can_view_reel(reels, auth.uid()));

-- REEL LIKES policies
create policy "reel_likes: owner upsert" on public.reel_likes
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- REEL BOOKMARKS policies
create policy "reel_bookmarks: owner upsert" on public.reel_bookmarks
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- REEL COMMENTS policies
create policy "reel_comments: author upsert" on public.reel_comments
for insert, update, delete to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "reel_comments: read if reel viewable" on public.reel_comments
for select to authenticated
using (exists (select 1 from public.reels r where r.id = reel_id and public.can_view_reel(r, auth.uid())));

-- REEL COMMENT LIKES policies
create policy "reel_comment_likes: owner upsert" on public.reel_comment_likes
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- REEL VIEWS policies
create policy "reel_views: owner upsert" on public.reel_views
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Triggers for counter updates
create or replace function public.bump_reel_counts()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'reel_comments' and tg_op = 'INSERT' then
    update public.reels set comment_count = comment_count + 1 where id = new.reel_id;
  elsif tg_table_name = 'reel_comments' and tg_op = 'DELETE' then
    update public.reels set comment_count = greatest(comment_count - 1, 0) where id = old.reel_id;
  elsif tg_table_name = 'reel_likes' and tg_op = 'INSERT' then
    update public.reels set like_count = like_count + 1 where id = new.reel_id;
  elsif tg_table_name = 'reel_likes' and tg_op = 'DELETE' then
    update public.reels set like_count = greatest(like_count - 1, 0) where id = old.reel_id;
  elsif tg_table_name = 'reel_views' and tg_op in ('INSERT','UPDATE') then
    update public.reels set view_count = view_count + 1 where id = coalesce(new.reel_id, old.reel_id);
  end if;
  return null;
end;
$$;

-- Create triggers
create trigger trg_reel_comment_counts_ins after insert on public.reel_comments
for each row execute function public.bump_reel_counts();

create trigger trg_reel_comment_counts_del after delete on public.reel_comments
for each row execute function public.bump_reel_counts();

create trigger trg_reel_like_counts_ins after insert on public.reel_likes
for each row execute function public.bump_reel_counts();

create trigger trg_reel_like_counts_del after delete on public.reel_likes
for each row execute function public.bump_reel_counts();

create trigger trg_reel_views_ins after insert on public.reel_views
for each row execute function public.bump_reel_counts();

-- Indexes for performance
create index if not exists idx_reels_author_created on public.reels(author_id, created_at desc);
create index if not exists idx_reels_status_created on public.reels(status, created_at desc) where status = 'READY';
create index if not exists idx_reels_visibility_created on public.reels(visibility, created_at desc);
create index if not exists idx_reel_likes_reel on public.reel_likes(reel_id);
create index if not exists idx_reel_comments_reel on public.reel_comments(reel_id, created_at desc);
create index if not exists idx_reel_views_reel on public.reel_views(reel_id);
create index if not exists idx_reels_tags on public.reels using gin(tags);

-- Function to get feed with ranking
create or replace function public.get_reel_feed(
  user_id uuid,
  feed_type text default 'for_you',
  limit_count int default 10,
  cursor_timestamp timestamptz default null
)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar text,
  caption text,
  tags text[],
  audio_title text,
  audio_url text,
  hls_url text,
  thumb_url text,
  duration_seconds int,
  width int,
  height int,
  visibility text,
  like_count int,
  comment_count int,
  share_count int,
  view_count int,
  completion_rate numeric,
  created_at timestamptz,
  is_liked boolean,
  is_bookmarked boolean,
  is_following boolean,
  score numeric
) language sql stable as $$
  with ranked_reels as (
    select 
      r.*,
      up.display_name as author_name,
      up.avatar_url as author_avatar,
      exists(select 1 from public.reel_likes rl where rl.reel_id = r.id and rl.user_id = user_id) as is_liked,
      exists(select 1 from public.reel_bookmarks rb where rb.reel_id = r.id and rb.user_id = user_id) as is_bookmarked,
      exists(select 1 from public.follows f where f.follower_id = user_id and f.followee_id = r.author_id) as is_following,
      -- Ranking algorithm: engagement + recency
      (r.like_count * 4 + r.comment_count * 3 + r.view_count + (r.completion_rate * 5) - 
       extract(epoch from (now() - r.created_at)) / 3600) as score
    from public.reels r
    join public.user_profiles up on up.id = r.author_id
    where 
      r.status = 'READY' and
      public.can_view_reel(r, user_id) and
      (cursor_timestamp is null or r.created_at < cursor_timestamp) and
      (feed_type = 'for_you' or 
       (feed_type = 'following' and exists(select 1 from public.follows f where f.follower_id = user_id and f.followee_id = r.author_id)))
  )
  select 
    rr.id,
    rr.author_id,
    rr.author_name,
    rr.author_avatar,
    rr.caption,
    rr.tags,
    rr.audio_title,
    rr.audio_url,
    rr.hls_url,
    rr.thumb_url,
    rr.duration_seconds,
    rr.width,
    rr.height,
    rr.visibility,
    rr.like_count,
    rr.comment_count,
    rr.share_count,
    rr.view_count,
    rr.completion_rate,
    rr.created_at,
    rr.is_liked,
    rr.is_bookmarked,
    rr.is_following,
    rr.score
  from ranked_reels rr
  order by 
    case when feed_type = 'for_you' then rr.score else null end desc,
    case when feed_type = 'following' then rr.created_at else null end desc
  limit limit_count;
$$;
