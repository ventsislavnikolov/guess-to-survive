-- Profile stats RPC (auth-scoped).
-- Computes:
-- - games played
-- - games won + win rate
-- - total winnings (completed payouts)
-- - longest survival streak (max count of won/voided picks in any game)

drop function if exists public.get_my_profile_stats();

create or replace function public.get_my_profile_stats()
returns table (
  games_played integer,
  games_won integer,
  win_rate numeric,
  total_winnings numeric,
  longest_streak integer
)
language sql
stable
set search_path = public
as $$
  with my_games as (
    select distinct gp.game_id
    from public.game_players gp
    where gp.user_id = auth.uid()
  ),
  played as (
    select count(*)::integer as games_played
    from my_games
  ),
  won as (
    select count(*)::integer as games_won
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.user_id = auth.uid()
      and g.status = 'completed'
      and gp.status = 'alive'
  ),
  winnings as (
    select coalesce(sum(p.amount), 0)::numeric as total_winnings
    from public.payouts p
    where p.user_id = auth.uid()
      and p.status = 'completed'
  ),
  streaks as (
    select
      mg.game_id,
      (
        select count(*)::integer
        from public.picks p
        where p.game_id = mg.game_id
          and p.user_id = auth.uid()
          and p.result in ('won', 'voided')
      ) as streak
    from my_games mg
  ),
  longest as (
    select coalesce(max(streak), 0)::integer as longest_streak
    from streaks
  )
  select
    played.games_played,
    won.games_won,
    case
      when played.games_played = 0 then 0
      else round((won.games_won::numeric / played.games_played::numeric) * 100, 2)
    end as win_rate,
    winnings.total_winnings,
    longest.longest_streak
  from played, won, winnings, longest;
$$;

grant execute on function public.get_my_profile_stats() to authenticated;

