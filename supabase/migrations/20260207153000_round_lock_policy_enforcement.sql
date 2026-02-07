-- Enforce round lock at database policy level for pick inserts/updates.

create or replace function public.round_lock_time(p_round integer)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select min(f.kickoff_time)
  from public.fixtures f
  where f.round = p_round;
$$;

create or replace function public.is_round_open(p_round integer)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(now() < public.round_lock_time(p_round), false);
$$;

grant execute on function public.round_lock_time(integer) to anon;
grant execute on function public.round_lock_time(integer) to authenticated;
grant execute on function public.is_round_open(integer) to anon;
grant execute on function public.is_round_open(integer) to authenticated;

drop policy if exists picks_insert_self on public.picks;
create policy picks_insert_self
  on public.picks
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.game_players gp
      where gp.game_id = picks.game_id
        and gp.user_id = auth.uid()
    )
    and public.is_round_open(round)
  );

drop policy if exists picks_update_self on public.picks;
create policy picks_update_self
  on public.picks
  for update
  using (
    user_id = auth.uid()
    and public.is_round_open(round)
  )
  with check (
    user_id = auth.uid()
    and public.is_round_open(round)
  );
