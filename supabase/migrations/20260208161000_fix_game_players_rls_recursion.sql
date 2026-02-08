-- Fix infinite recursion in RLS policy on public.game_players.
-- The previous policy queried public.game_players inside itself, which causes
-- Postgres to throw 42P17 ("infinite recursion detected in policy").

drop policy if exists game_players_read_members on public.game_players;

drop function if exists public.is_game_member(uuid);

create or replace function public.is_game_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    where gp.game_id = p_game_id
      and gp.user_id = auth.uid()
  );
$$;

grant execute on function public.is_game_member(uuid) to anon;
grant execute on function public.is_game_member(uuid) to authenticated;

create policy game_players_read_members
  on public.game_players
  for select
  using (
    public.is_game_member(game_players.game_id)
    or exists (
      select 1
      from public.games g
      where g.id = game_players.game_id
        and g.manager_id = auth.uid()
    )
  );

