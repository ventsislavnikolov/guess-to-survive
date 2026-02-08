-- Public game browser RPC with filters, sorting, and pagination metadata.
-- Uses SECURITY DEFINER to expose aggregated player counts without exposing player records.

drop function if exists public.list_public_games(integer, integer, text, text, numeric, numeric, text);

create or replace function public.list_public_games(
  p_page integer default 1,
  p_page_size integer default 12,
  p_status text default null,
  p_payment_type text default 'all',
  p_min_entry_fee numeric default null,
  p_max_entry_fee numeric default null,
  p_sort_by text default 'newest'
)
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
  player_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
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
    where g.visibility = 'public'
      and (p_status is null or g.status = p_status)
      and (
        p_payment_type = 'all'
        or (p_payment_type = 'free' and coalesce(g.entry_fee, 0) = 0)
        or (p_payment_type = 'paid' and coalesce(g.entry_fee, 0) > 0)
      )
      and (p_min_entry_fee is null or coalesce(g.entry_fee, 0) >= p_min_entry_fee)
      and (p_max_entry_fee is null or coalesce(g.entry_fee, 0) <= p_max_entry_fee)
    group by g.id
  ),
  ordered as (
    select
      f.*,
      count(*) over ()::bigint as total_count,
      row_number() over (
        order by
          case when p_sort_by = 'most_players' then f.player_count end desc nulls last,
          case when p_sort_by = 'starting_soonest' then coalesce(f.current_round, f.starting_round) end asc nulls last,
          f.created_at desc
      ) as row_number
    from filtered f
  )
  select
    o.id,
    o.name,
    o.code,
    o.visibility,
    o.status,
    o.entry_fee,
    o.currency,
    o.min_players,
    o.max_players,
    o.current_round,
    o.starting_round,
    o.manager_id,
    o.created_at,
    o.updated_at,
    o.pick_visibility,
    o.wipeout_mode,
    o.rebuy_deadline,
    o.prize_pool,
    o.player_count,
    o.total_count
  from ordered o
  where o.row_number > (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_page_size, 12), 1)
    and o.row_number <= greatest(coalesce(p_page, 1), 1) * greatest(coalesce(p_page_size, 12), 1)
  order by o.row_number;
$$;

grant execute on function public.list_public_games(integer, integer, text, text, numeric, numeric, text) to anon;
grant execute on function public.list_public_games(integer, integer, text, text, numeric, numeric, text) to authenticated;
