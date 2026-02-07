create or replace function public.get_runtime_secret(secret_name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_value text;
begin
  select ds.decrypted_secret
  into secret_value
  from vault.decrypted_secrets ds
  where ds.name = secret_name
  order by ds.updated_at desc
  limit 1;

  if secret_value is null then
    raise exception 'Secret not found: %', secret_name;
  end if;

  return secret_value;
end;
$$;

revoke all on function public.get_runtime_secret(text) from public;
revoke execute on function public.get_runtime_secret(text) from anon;
revoke execute on function public.get_runtime_secret(text) from authenticated;
grant execute on function public.get_runtime_secret(text) to service_role;
