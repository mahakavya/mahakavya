-- Speed up recent lookups
create index if not exists idx_posts_created_desc on posts(created_at desc);
create index if not exists idx_post_likes_recent on post_likes(post_id, created_at desc);
create index if not exists idx_post_comments_recent on post_comments(post_id, created_at desc);
create index if not exists idx_follows_follower on follows(follower_id, followee_id);

-- Optional view: engagement in last 6h (rolling)
create or replace view v_post_engagement_6h as
select
  p.id as post_id,
  count(distinct pl.id) filter (where pl.created_at > now() - interval '6 hours') as likes6h,
  count(distinct pc.id) filter (where pc.created_at > now() - interval '6 hours') as comments6h
from posts p
left join post_likes pl on pl.post_id = p.id
left join post_comments pc on pc.post_id = p.id
group by p.id;

-- Optional helper: flatten tags (already text[] in posts)
create or replace function array_intersect(a text[], b text[]) returns int
language sql immutable as $$
  select coalesce(cardinality(array(select unnest(a) intersect select unnest(b))), 0);
$$;
