-- Keep public.users in sync with auth.users for game foreign keys and UI display.
-- This mirrors the trigger functions currently present in the Supabase project, and makes
-- new environments reproducible from migrations.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, email_verified)
  values (new.id, new.email, (new.email_confirmed_at is not null))
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
    set email = new.email,
        email_verified = (new.email_confirmed_at is not null),
        updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_update();

