drop policy if exists notifications_insert_self on public.notifications;
create policy notifications_insert_self
  on public.notifications
  for insert
  with check (user_id = auth.uid());
