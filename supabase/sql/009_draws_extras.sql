-- fast lookups
create index if not exists idx_draws_status on draws(status);
create index if not exists idx_draws_draw_at on draws(draw_at);
create index if not exists idx_entries_draw on entries(draw_id);
create index if not exists idx_entries_user on entries(user_id);

-- helper function to capture a "close anchor" (entropy anchor)
create or replace function close_draw(p_draw uuid, p_closed_at timestamptz)
returns void
language sql as $$
  update draws 
    set status = 'closed',
        result = coalesce(result, '{}'::jsonb) || jsonb_build_object('closed_at', p_closed_at)
  where id = p_draw and status = 'upcoming';
$$;
