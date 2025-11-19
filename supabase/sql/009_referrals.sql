-- Referral system tables
create table referral_codes (
  code text primary key,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(owner_id)
);

create index idx_ref_codes_owner on referral_codes(owner_id);

-- Referral status enum
create type referral_status as enum ('claimed','qualified','rewarded');

create table referrals (
  id uuid primary key default gen_random_uuid(),
  code text references referral_codes(code) on delete cascade,
  inviter_id uuid references profiles(id) on delete set null,
  invitee_id uuid references profiles(id) on delete cascade,
  status referral_status default 'claimed',
  created_at timestamptz default now(),
  unique(invitee_id)
);

create index idx_referrals_inviter on referrals(inviter_id);
create index idx_referrals_code on referrals(code);

-- Referral credits table
create table referral_credits (
  user_id uuid primary key references profiles(id) on delete cascade,
  days int not null default 0,
  updated_at timestamptz default now()
);

-- RLS policies for referral tables
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table referral_credits enable row level security;

-- Referral code policies
create policy "ref_code_owner_read" on referral_codes
  for select using (owner_id = auth.uid());

create policy "ref_code_owner_insert" on referral_codes
  for insert with check (owner_id = auth.uid());

-- Referral policies
create policy "ref_list_inviter_invitee" on referrals
  for select using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- Referral credits policies
create policy "ref_credits_owner_rw" on referral_credits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
