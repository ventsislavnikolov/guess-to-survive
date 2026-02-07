-- Align public.users with v1 requirements for profile/auth extension.
-- This migration is idempotent and safe to run multiple times.

alter table if exists public.users
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists email_verified boolean default false,
  add column if not exists role text default 'user',
  add column if not exists self_excluded_until timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_length'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_username_length
      check (
        username is null
        or (char_length(username) >= 3 and char_length(username) <= 20)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_username_format'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_username_format
      check (
        username is null
        or username ~ '^[a-zA-Z0-9_]+$'
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'users_set_updated_at'
      and tgrelid = 'public.users'::regclass
  ) then
    create trigger users_set_updated_at
      before update on public.users
      for each row execute function public.set_updated_at();
  end if;
end $$;
