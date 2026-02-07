create unique index if not exists payouts_game_user_key
  on public.payouts (game_id, user_id);

create index if not exists payouts_status_idx
  on public.payouts (status);
