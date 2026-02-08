alter table public.payments
  add column if not exists payment_type text not null default 'entry',
  add column if not exists rebuy_round integer not null default 0;

alter table public.payments
  drop constraint if exists payments_game_id_user_id_key;

create unique index if not exists payments_unique_payment_key
  on public.payments (game_id, user_id, payment_type, rebuy_round);

create index if not exists payments_payment_type_idx
  on public.payments (payment_type);

create index if not exists payments_rebuy_round_idx
  on public.payments (rebuy_round);
