alter table public.profiles
add column if not exists stripe_connect_id text;

create unique index if not exists profiles_stripe_connect_id_key
  on public.profiles (stripe_connect_id)
  where stripe_connect_id is not null;
