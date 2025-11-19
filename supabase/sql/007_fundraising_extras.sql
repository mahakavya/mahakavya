create index if not exists idx_campaigns_owner on campaigns(owner_id);
create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_donations_campaign on donations(campaign_id);
create index if not exists idx_donations_user on donations(user_id);

-- Optional safe increment via function (if you prefer server RPC):
create or replace function inc_campaign_raised(p_campaign uuid, p_amount int)
returns void
language sql as $$
  update campaigns set raised_amount = raised_amount + p_amount
  where id = p_campaign;
$$;
