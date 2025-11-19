-- Function to safely increment referral credits
create or replace function increment_referral_credits(p_user_id uuid, p_days int)
returns void
language sql
security definer
as $$
  insert into referral_credits (user_id, days, updated_at)
  values (p_user_id, p_days, now())
  on conflict (user_id) do update set
    days = referral_credits.days + p_days,
    updated_at = now();
$$;
