-- Make round availability season-aware without adding schema.
-- We infer the current season "segment" by looking for large gaps between
-- consecutive fixture kickoff times.

-- Helper: returns the inferred current season segment id for Premier League.
create or replace function public.current_pl_season_segment()
returns integer
language sql
stable
set search_path = public
as $$
  with pl as (
    select id as league_id
    from public.leagues
    where code = 'PL'
    limit 1
  ),
  ordered as (
    select
      f.kickoff_time,
      case
        when f.kickoff_time - lag(f.kickoff_time) over (order by f.kickoff_time)
          > interval '40 days'
        then 1
        else 0
      end as season_break
    from public.fixtures f
    where f.league_id = (select league_id from pl)
  ),
  segmented as (
    select
      kickoff_time,
      sum(season_break) over (
        order by kickoff_time
        rows between unbounded preceding and current row
      ) as season_segment
    from ordered
  )
  select s.season_segment
  from segmented s
  where s.kickoff_time > now()
  order by s.kickoff_time asc
  limit 1;
$$;

grant execute on function public.current_pl_season_segment() to anon;
grant execute on function public.current_pl_season_segment() to authenticated;

-- Replace list_upcoming_rounds to use the inferred current season segment.
create or replace function public.list_upcoming_rounds()
returns table(round integer, lock_time timestamptz)
language sql
stable
set search_path = public
as $$
  with pl as (
    select id as league_id
    from public.leagues
    where code = 'PL'
    limit 1
  ),
  season as (
    select public.current_pl_season_segment() as season_segment
  ),
  ordered as (
    select
      f.round,
      f.kickoff_time,
      case
        when f.kickoff_time - lag(f.kickoff_time) over (order by f.kickoff_time)
          > interval '40 days'
        then 1
        else 0
      end as season_break
    from public.fixtures f
    where f.league_id = (select league_id from pl)
  ),
  segmented as (
    select
      round,
      kickoff_time,
      sum(season_break) over (
        order by kickoff_time
        rows between unbounded preceding and current row
      ) as season_segment
    from ordered
  ),
  in_season as (
    select s.round, s.kickoff_time
    from segmented s
    where s.season_segment = (select season_segment from season)
  )
  select
    s.round,
    min(s.kickoff_time) as lock_time
  from in_season s
  group by s.round
  having min(s.kickoff_time) > now()
  order by lock_time asc, round asc;
$$;

-- Replace first_available_round to pick from the season-aware list.
create or replace function public.first_available_round()
returns integer
language sql
stable
set search_path = public
as $$
  select r.round
  from public.list_upcoming_rounds() r
  order by r.lock_time asc, r.round asc
  limit 1;
$$;

grant execute on function public.first_available_round() to anon;
grant execute on function public.first_available_round() to authenticated;
grant execute on function public.list_upcoming_rounds() to anon;
grant execute on function public.list_upcoming_rounds() to authenticated;

-- Replace round lock helpers to also be season-aware (used by pick RLS).
create or replace function public.round_lock_time(p_round integer)
returns timestamptz
language sql
stable
set search_path = public
as $$
  with pl as (
    select id as league_id
    from public.leagues
    where code = 'PL'
    limit 1
  ),
  season as (
    select public.current_pl_season_segment() as season_segment
  ),
  ordered as (
    select
      f.round,
      f.kickoff_time,
      case
        when f.kickoff_time - lag(f.kickoff_time) over (order by f.kickoff_time)
          > interval '40 days'
        then 1
        else 0
      end as season_break
    from public.fixtures f
    where f.league_id = (select league_id from pl)
  ),
  segmented as (
    select
      round,
      kickoff_time,
      sum(season_break) over (
        order by kickoff_time
        rows between unbounded preceding and current row
      ) as season_segment
    from ordered
  )
  select min(s.kickoff_time)
  from segmented s
  where s.season_segment = (select season_segment from season)
    and s.round = p_round;
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

-- Replace trigger function to use season-aware list_upcoming_rounds.
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

  select r.lock_time
    into v_requested_lock
  from public.list_upcoming_rounds() r
  where r.round = new.starting_round
  limit 1;

  if v_requested_lock is null or v_requested_lock <= now() then
    new.starting_round := v_first_available;
  end if;

  return new;
end;
$$;
