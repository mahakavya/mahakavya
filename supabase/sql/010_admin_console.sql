-- Profiles: activation flag
alter table if exists profiles 
  add column if not exists is_active boolean default true;

create index if not exists idx_profiles_active on profiles(is_active);

-- Content visibility for moderation
alter table if exists posts 
  add column if not exists is_hidden boolean default false;

alter table if exists post_comments 
  add column if not exists is_hidden boolean default false;

alter table if exists reels 
  add column if not exists is_hidden boolean default false;

-- Speed up reports listing
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_entity on reports(entity_type, entity_id);
