-- Self-service account deletion RPC for authenticated users.
-- Deletes the auth user row; related rows with ON DELETE CASCADE are removed automatically.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  uid := auth.uid();

  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users
  where id = uid;
exception
  when foreign_key_violation then
    raise exception 'Account cannot be deleted while related records still exist.';
end;
$$;
