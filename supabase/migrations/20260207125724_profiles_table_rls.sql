-- Add dedicated public.profiles table for user profile data and RLS access.
-- This migration is idempotent and compatible with existing public.users data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  avatar_url text,
  email_verified boolean default false,
  role text not null default 'user',
  self_excluded_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_length
      check (
        username is null
        or (char_length(username) >= 3 and char_length(username) <= 20)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (
        username is null
        or username ~ '^[a-zA-Z0-9_]+$'
      );
  end if;
end $$;

-- Backfill from existing public.users records.
insert into public.profiles (
  id,
  email,
  username,
  avatar_url,
  email_verified,
  role,
  self_excluded_until,
  created_at,
  updated_at
)
select
  u.id,
  u.email,
  u.username,
  u.avatar_url,
  coalesce(u.email_verified, false),
  coalesce(u.role, 'user'),
  u.self_excluded_until,
  coalesce(u.created_at, now()),
  coalesce(u.updated_at, now())
from public.users u
on conflict (id) do update
set
  email = excluded.email,
  username = excluded.username,
  avatar_url = excluded.avatar_url,
  email_verified = excluded.email_verified,
  role = excluded.role,
  self_excluded_until = excluded.self_excluded_until,
  updated_at = now();

-- Keep profiles in sync for new/updated auth users.
create or replace function public.sync_auth_user_to_profiles()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    avatar_url,
    email_verified,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'avatar_url',
    (new.email_confirmed_at is not null),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(excluded.username, public.profiles.username),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email_verified = excluded.email_verified,
    updated_at = now();

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created_profiles'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created_profiles
      after insert on auth.users
      for each row execute function public.sync_auth_user_to_profiles();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_updated_profiles'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_updated_profiles
      after update on auth.users
      for each row execute function public.sync_auth_user_to_profiles();
  end if;
end $$;

-- Updated at trigger
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profiles_set_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS policies
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
