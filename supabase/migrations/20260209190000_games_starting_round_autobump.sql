-- Auto-bump starting_round to the first upcoming round at insert time.
-- This prevents creating games that start in already-locked rounds.

create or replace function public.first_available_round()
returns integer
language sql
stable
set search_path = public
as $$
  select f.round
  from public.fixtures f
  group by f.round
  having min(f.kickoff_time) > now()
  order by min(f.kickoff_time) asc, f.round asc
  limit 1;
$$;

create or replace function public.list_upcoming_rounds()
returns table(round integer, lock_time timestamptz)
language sql
stable
set search_path = public
as $$
  select
    f.round,
    min(f.kickoff_time) as lock_time
  from public.fixtures f
  group by f.round
  having min(f.kickoff_time) > now()
  order by lock_time asc, round asc;
$$;

grant execute on function public.first_available_round() to anon;
grant execute on function public.first_available_round() to authenticated;
grant execute on function public.list_upcoming_rounds() to anon;
grant execute on function public.list_upcoming_rounds() to authenticated;

create or replace function public.games_normalize_starting_round()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_available integer;
  v_requested_lock timestamptz;
begin
  v_first_available := public.first_available_round();

  if v_first_available is null then
    raise exception 'No upcoming rounds available.' using errcode = 'P0001';
  end if;

  select min(f.kickoff_time)
    into v_requested_lock
  from public.fixtures f
  where f.round = new.starting_round;

  if v_requested_lock is null or v_requested_lock <= now() then
    new.starting_round := v_first_available;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_games_normalize_starting_round on public.games;
create trigger trg_games_normalize_starting_round
before insert on public.games
for each row
execute function public.games_normalize_starting_round();
