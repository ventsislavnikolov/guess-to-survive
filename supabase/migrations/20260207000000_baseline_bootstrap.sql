-- Baseline schema to bootstrap fresh projects before applying tracked migrations.
-- This recreates core tables expected by later migrations.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  avatar_url text,
  email_verified boolean default false,
  role text not null default 'user',
  self_excluded_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check check (role in ('user', 'admin'))
);

-- Keep users in sync with auth records in fresh projects.
insert into public.users (id, email, email_verified)
select id, email, (email_confirmed_at is not null)
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  email_verified = excluded.email_verified,
  updated_at = now();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.leagues (
  id serial primary key,
  name text not null,
  code text not null unique,
  country text,
  current_season text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists leagues_set_updated_at on public.leagues;
create trigger leagues_set_updated_at
before update on public.leagues
for each row execute function public.set_updated_at();

create table if not exists public.teams (
  id serial primary key,
  league_id integer not null references public.leagues(id) on delete cascade,
  name text not null,
  short_name text,
  crest_url text,
  external_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create table if not exists public.fixtures (
  id serial primary key,
  league_id integer not null references public.leagues(id) on delete cascade,
  round integer not null,
  home_team_id integer not null references public.teams(id) on delete cascade,
  away_team_id integer not null references public.teams(id) on delete cascade,
  kickoff_time timestamptz not null,
  status text not null default 'scheduled',
  home_score integer,
  away_score integer,
  external_id integer unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixtures_status_check check (
    status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')
  )
);

create index if not exists fixtures_round_idx on public.fixtures(league_id, round);
create index if not exists fixtures_kickoff_idx on public.fixtures(kickoff_time);

drop trigger if exists fixtures_set_updated_at on public.fixtures;
create trigger fixtures_set_updated_at
before update on public.fixtures
for each row execute function public.set_updated_at();

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  manager_id uuid not null references public.users(id) on delete restrict,
  visibility text not null default 'public',
  entry_fee numeric(10,2) default 0,
  currency text not null default 'EUR',
  starting_round integer not null,
  current_round integer,
  min_players integer not null default 2,
  max_players integer,
  wipeout_mode text not null default 'split',
  pick_visibility text not null default 'hidden',
  status text not null default 'pending',
  prize_pool numeric(10,2) default 0,
  rebuy_deadline timestamptz,
  rebuy_window_days integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_visibility_check check (visibility in ('public', 'private')),
  constraint games_currency_check check (currency in ('EUR', 'GBP', 'USD')),
  constraint games_wipeout_mode_check check (wipeout_mode in ('split', 'rebuy')),
  constraint games_pick_visibility_check check (pick_visibility in ('hidden', 'visible')),
  constraint games_status_check check (status in ('pending', 'active', 'completed', 'cancelled')),
  constraint games_min_players_check check (min_players >= 2),
  constraint games_max_players_check check (max_players is null or max_players >= min_players)
);

create index if not exists games_status_idx on public.games(status);
create index if not exists games_manager_idx on public.games(manager_id);
create index if not exists games_code_idx on public.games(code);

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

create table if not exists public.game_players (
  id serial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'alive',
  eliminated_round integer,
  kick_reason text,
  joined_at timestamptz not null default now(),
  is_rebuy boolean not null default false,
  stripe_payment_id text,
  unique(game_id, user_id),
  constraint game_players_status_check check (status in ('alive', 'eliminated', 'kicked'))
);

create index if not exists game_players_game_idx on public.game_players(game_id);
create index if not exists game_players_user_idx on public.game_players(user_id);

create table if not exists public.picks (
  id serial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  round integer not null,
  team_id integer not null references public.teams(id) on delete restrict,
  auto_assigned boolean not null default false,
  result text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(game_id, user_id, round),
  constraint picks_result_check check (result in ('pending', 'won', 'lost', 'draw', 'voided'))
);

create index if not exists picks_game_round_idx on public.picks(game_id, round);
create index if not exists picks_user_idx on public.picks(user_id);

create table if not exists public.payouts (
  id serial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  stripe_transfer_id text,
  created_at timestamptz not null default now(),
  constraint payouts_status_check check (status in ('pending', 'processing', 'completed', 'failed')),
  constraint payouts_currency_check check (currency in ('EUR', 'GBP', 'USD'))
);

create table if not exists public.notifications (
  id serial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'round_reminder',
      'pick_confirmed',
      'pick_voided',
      'round_results',
      'game_won',
      'eliminated',
      'kicked',
      'payout_sent',
      'player_joined',
      'game_starting',
      'game_cancelled'
    )
  )
);

create index if not exists notifications_user_idx on public.notifications(user_id, read);
create index if not exists notifications_created_idx on public.notifications(created_at desc);

insert into public.leagues (name, code, country, current_season)
values ('Premier League', 'PL', 'England', '2025-26')
on conflict (code) do update
set
  name = excluded.name,
  country = excluded.country,
  current_season = excluded.current_season,
  updated_at = now();
