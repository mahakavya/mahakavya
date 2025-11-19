-- SAMVAAHA SOCIAL FEED SCHEMA
-- Complete social media functionality with posts, comments, likes, bookmarks, flags

-- Ensure user_profiles exists (may already exist)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text unique,
  avatar_url text,
  role text not null default 'USER' check (role in ('USER','ADMIN','SUPER_ADMIN','MASTER_ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- POSTS table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  body text,
  media_urls text[] default '{}',              -- supabase storage paths
  media_types text[] default '{}',            -- 'image' | 'video' per item
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','FOLLOWERS','PRIVATE')),
  comment_count int not null default 0,
  like_count int not null default 0,
  share_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- COMMENTS table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  body text not null,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- POST LIKES table
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- COMMENT LIKES table
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- BOOKMARKS table
create table if not exists public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- MODERATION FLAGS table
create table if not exists public.moderation_flags (
  id bigserial primary key,
  content_type text not null check (content_type in ('post','comment')),
  content_id uuid not null,
  reporter_id uuid references public.user_profiles(id) on delete set null,
  reason text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.user_profiles(id),
  reviewed_at timestamptz
);

-- FOLLOWS table (for FOLLOWERS visibility)
create table if not exists public.follows (
  follower_id uuid not null references public.user_profiles(id) on delete cascade,
  followee_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

-- NOTIFICATIONS table (for future use)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null check (type in ('like','comment','follow','mention')),
  content jsonb not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS on all tables
alter table public.user_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.comment_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Helper function: is_admin()
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.user_profiles
    where id = uid and role in ('ADMIN','SUPER_ADMIN','MASTER_ADMIN')
  );
$$;

-- VISIBILITY check function
create or replace function public.can_view_post(p posts, uid uuid)
returns boolean language sql stable as $$
  select
    case
      when p.visibility = 'PUBLIC' then true
      when p.visibility = 'PRIVATE' then p.author_id = uid
      when p.visibility = 'FOLLOWERS' then
        (p.author_id = uid) or exists(
          select 1 from public.follows
          where follower_id = uid and followee_id = p.author_id
        )
      else false
    end;
$$;

-- RLS POLICIES

-- user_profiles: users read self, admins read all
create policy "profiles: self read"
on public.user_profiles for select
to authenticated using (id = auth.uid());

create policy "profiles: admins read all"
on public.user_profiles for select
to authenticated using (public.is_admin(auth.uid()));

create policy "profiles: self update"
on public.user_profiles for update
to authenticated using (id = auth.uid());

-- posts: author full control, viewers read by visibility
create policy "posts: author insert"
on public.posts for insert to authenticated
with check (author_id = auth.uid());

create policy "posts: author update"
on public.posts for update to authenticated
using (author_id = auth.uid());

create policy "posts: author delete"
on public.posts for delete to authenticated
using (author_id = auth.uid());

create policy "posts: read by visibility"
on public.posts for select to authenticated
using (public.can_view_post(posts, auth.uid()));

-- comments: author insert/update/delete; readable if post viewable
create policy "comments: author insert"
on public.comments for insert to authenticated
with check (author_id = auth.uid());

create policy "comments: author update"
on public.comments for update to authenticated
using (author_id = auth.uid());

create policy "comments: author delete"
on public.comments for delete to authenticated
using (author_id = auth.uid());

create policy "comments: read if post viewable"
on public.comments for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and public.can_view_post(p, auth.uid())));

-- likes/bookmarks: owner manage
create policy "post_likes: upsert by owner"
on public.post_likes for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "comment_likes: upsert by owner"
on public.comment_likes for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "bookmarks: upsert by owner"
on public.bookmarks for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- flags: any auth can create; admins read/update
create policy "flags: create by any"
on public.moderation_flags for insert to authenticated
with check (reporter_id = auth.uid());

create policy "flags: admins read/update"
on public.moderation_flags for select to authenticated using (public.is_admin(auth.uid()));

create policy "flags: admins update"
on public.moderation_flags for update to authenticated using (public.is_admin(auth.uid()));

-- follows: owner manage
create policy "follows: upsert by owner"
on public.follows for all to authenticated
using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- notifications: user read own
create policy "notifications: user read own"
on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy "notifications: user update own"
on public.notifications for update to authenticated
using (user_id = auth.uid());

-- Counter update triggers
create or replace function public.bump_post_counts()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'comments' and tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_table_name = 'comments' and tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  elsif tg_table_name = 'post_likes' and tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_table_name = 'post_likes' and tg_op = 'DELETE' then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.bump_comment_counts()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
  end if;
  return coalesce(new, old);
end;
$$;

-- Create triggers
drop trigger if exists trg_comment_counts_ins on public.comments;
drop trigger if exists trg_comment_counts_del on public.comments;
drop trigger if exists trg_like_counts_ins on public.post_likes;
drop trigger if exists trg_like_counts_del on public.post_likes;
drop trigger if exists trg_comment_like_counts_ins on public.comment_likes;
drop trigger if exists trg_comment_like_counts_del on public.comment_likes;

create trigger trg_comment_counts_ins after insert on public.comments
for each row execute function public.bump_post_counts();

create trigger trg_comment_counts_del after delete on public.comments
for each row execute function public.bump_post_counts();

create trigger trg_like_counts_ins after insert on public.post_likes
for each row execute function public.bump_post_counts();

create trigger trg_like_counts_del after delete on public.post_likes
for each row execute function public.bump_post_counts();

create trigger trg_comment_like_counts_ins after insert on public.comment_likes
for each row execute function public.bump_comment_counts();

create trigger trg_comment_like_counts_del after delete on public.comment_likes
for each row execute function public.bump_comment_counts();

-- Indexes for performance
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_posts_visibility on public.posts(visibility);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);
create index if not exists idx_post_likes_post_id on public.post_likes(post_id);
create index if not exists idx_post_likes_user_id on public.post_likes(user_id);
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_followee_id on public.follows(followee_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);

-- Updated at trigger function
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger trg_posts_updated_at before update on public.posts
for each row execute function public.update_updated_at_column();

create trigger trg_comments_updated_at before update on public.comments
for each row execute function public.update_updated_at_column();

create trigger trg_user_profiles_updated_at before update on public.user_profiles
for each row execute function public.update_updated_at_column();
