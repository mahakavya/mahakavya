-- Codes owned by inviter
create table if not exists referral_codes (
  code text primary key,                          -- e.g., 6–10 char slug
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(owner_id)
);
create index if not exists idx_ref_codes_owner on referral_codes(owner_id);

-- Claims by invitees
create type referral_status as enum ('claimed','qualified','rewarded');
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  code text references referral_codes(code) on delete cascade,
  inviter_id uuid references profiles(id) on delete set null,
  invitee_id uuid references profiles(id) on delete cascade,
  status referral_status default 'claimed',
  created_at timestamptz default now(),
  unique(invitee_id)
);
create index if not exists idx_referrals_inviter on referrals(inviter_id);
create index if not exists idx_referrals_code on referrals(code);

-- Banked credits (days) for users without active sub at reward time
create table if not exists referral_credits (
  user_id uuid primary key references profiles(id) on delete cascade,
  days int not null default 0,
  updated_at timestamptz default now()
);

-- RLS
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table referral_credits enable row level security;

-- Only code owner can read their code; anyone can insert via server (API) with auth
create policy "ref_code_owner_read" on referral_codes
  for select using (owner_id = auth.uid());
create policy "ref_code_owner_insert" on referral_codes
  for insert with check (owner_id = auth.uid());

-- Inviter sees their referrals; invitee sees their own row
create policy "ref_list_inviter_invitee" on referrals
  for select using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- Credits: owner rw
create policy "ref_credits_owner_rw" on referral_credits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
