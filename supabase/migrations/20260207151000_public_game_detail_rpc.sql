-- Public game detail snapshot with aggregated player count.
-- Uses SECURITY DEFINER so public pages can read game metadata and counts without exposing player rows.

drop function if exists public.get_public_game_detail(uuid);

create or replace function public.get_public_game_detail(p_game_id uuid)
returns table (
  id uuid,
  name text,
  code text,
  visibility text,
  status text,
  entry_fee numeric,
  currency text,
  min_players integer,
  max_players integer,
  current_round integer,
  starting_round integer,
  manager_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  pick_visibility text,
  wipeout_mode text,
  rebuy_deadline timestamptz,
  prize_pool numeric,
  player_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.code,
    g.visibility,
    g.status,
    g.entry_fee,
    g.currency,
    g.min_players,
    g.max_players,
    g.current_round,
    g.starting_round,
    g.manager_id,
    g.created_at,
    g.updated_at,
    g.pick_visibility,
    g.wipeout_mode,
    g.rebuy_deadline,
    g.prize_pool,
    coalesce(count(gp.id), 0)::bigint as player_count
  from public.games g
  left join public.game_players gp on gp.game_id = g.id
  where g.id = p_game_id
    and (g.visibility = 'public' or g.manager_id = auth.uid())
  group by g.id;
$$;

grant execute on function public.get_public_game_detail(uuid) to anon;
grant execute on function public.get_public_game_detail(uuid) to authenticated;
