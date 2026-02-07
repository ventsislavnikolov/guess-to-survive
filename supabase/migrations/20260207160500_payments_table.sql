create table if not exists public.payments (
  id bigserial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  currency text not null,
  entry_fee numeric(10, 2) not null,
  processing_fee numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  status text not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index if not exists payments_game_idx on public.payments (game_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_user_idx on public.payments (user_id);

create or replace function public.touch_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_payments_updated_at on public.payments;
create trigger trg_touch_payments_updated_at
before update on public.payments
for each row
execute function public.touch_payments_updated_at();

alter table public.payments enable row level security;

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own
on public.payments
for select
using (auth.uid() = user_id);
