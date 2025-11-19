-- Extensions for search
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Add search columns to posts
alter table posts
  add column if not exists search_tsv tsvector
  generated always as (to_tsvector('simple', unaccent(coalesce(body,'')))) stored;

create index idx_posts_tsv on posts using gin (search_tsv);
create index idx_posts_trgm on posts using gin (body gin_trgm_ops);

-- Add search columns to reels
alter table reels
  add column if not exists search_tsv tsvector
  generated always as (to_tsvector('simple', unaccent(coalesce(caption,'')))) stored;

create index idx_reels_tsv on reels using gin (search_tsv);
create index idx_reels_trgm on reels using gin (caption gin_trgm_ops);

-- Add search columns to campaigns
alter table campaigns
  add column if not exists search_tsv tsvector
  generated always as (to_tsvector('simple', unaccent(coalesce(title,'') || ' ' || coalesce(description,'')))) stored;

create index idx_campaigns_tsv on campaigns using gin (search_tsv);
create index idx_campaigns_title_trgm on campaigns using gin (title gin_trgm_ops);

-- Hashtag extractor function
create or replace function extract_tags(txt text) returns text[]
language sql immutable as $$
  select array(
    select lower(m[1]) from regexp_matches(txt, '#([A-Za-z0-9_]{2,50})', 'g') as m
  );
$$;

-- Trending hashtags view
create materialized view v_trending_hashtags as
with recent as (
  select created_at, unnest(extract_tags(coalesce(body,''))) as tag
  from posts
  where is_hidden = false and created_at > now() - interval '24 hours'
  union all
  select created_at, unnest(extract_tags(coalesce(caption,''))) as tag
  from reels
  where coalesce(is_hidden,false) = false and created_at > now() - interval '24 hours'
)
select tag, count(*)::int as cnt, max(created_at) as last_used
from recent
group by tag
order by cnt desc, last_used desc;

create index idx_trending_hashtags_cnt on v_trending_hashtags(cnt desc);

-- Trending campaigns view
create or replace view v_trending_campaigns_24h as
select c.id, c.title, sum(d.amount)::bigint as amount_24h, count(d.id)::int as donors_24h
from campaigns c
left join donations d on d.campaign_id = c.id and d.status='captured' and d.created_at > now() - interval '24 hours'
where c.status='live'
group by c.id, c.title
order by amount_24h desc, donors_24h desc;

-- Refresh trending function
create or replace function refresh_trending() returns void
language sql security definer as $$
  refresh materialized view concurrently v_trending_hashtags;
$$;
