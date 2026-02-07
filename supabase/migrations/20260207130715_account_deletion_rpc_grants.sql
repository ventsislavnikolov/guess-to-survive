revoke all on function public.delete_my_account() from public;
revoke execute on function public.delete_my_account() from anon;
revoke execute on function public.delete_my_account() from authenticated;
grant execute on function public.delete_my_account() to authenticated;
