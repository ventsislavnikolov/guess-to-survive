-- Align and harden core RLS policies for existing public tables.
-- Keeps current access model while adding stronger update checks.

alter table if exists public.leagues enable row level security;
alter table if exists public.teams enable row level security;
alter table if exists public.fixtures enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.games enable row level security;
alter table if exists public.game_players enable row level security;
alter table if exists public.picks enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.payouts enable row level security;

-- Public reference data
drop policy if exists leagues_read on public.leagues;
create policy leagues_read on public.leagues for select using (true);

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select using (true);

drop policy if exists fixtures_read on public.fixtures;
create policy fixtures_read on public.fixtures for select using (true);

-- Users
drop policy if exists users_select_self on public.users;
create policy users_select_self
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists users_update_self on public.users;
create policy users_update_self
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Games
drop policy if exists games_read_public on public.games;
create policy games_read_public
  on public.games
  for select
  using (visibility = 'public' or manager_id = auth.uid());

drop policy if exists games_insert_self on public.games;
create policy games_insert_self
  on public.games
  for insert
  with check (manager_id = auth.uid());

drop policy if exists games_update_manager on public.games;
create policy games_update_manager
  on public.games
  for update
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

-- Game players
drop policy if exists game_players_read_members on public.game_players;
create policy game_players_read_members
  on public.game_players
  for select
  using (
    exists (
      select 1
      from public.game_players gp
      where gp.game_id = game_players.game_id
        and gp.user_id = auth.uid()
    )
  );

drop policy if exists game_players_insert_self on public.game_players;
create policy game_players_insert_self
  on public.game_players
  for insert
  with check (user_id = auth.uid());

drop policy if exists game_players_update_manager on public.game_players;
create policy game_players_update_manager
  on public.game_players
  for update
  using (
    exists (
      select 1
      from public.games g
      where g.id = game_players.game_id
        and g.manager_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.games g
      where g.id = game_players.game_id
        and g.manager_id = auth.uid()
    )
  );

drop policy if exists game_players_delete_self on public.game_players;
create policy game_players_delete_self
  on public.game_players
  for delete
  using (user_id = auth.uid());

-- Picks
drop policy if exists picks_read_self_or_manager on public.picks;
create policy picks_read_self_or_manager
  on public.picks
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.games g
      where g.id = picks.game_id
        and g.manager_id = auth.uid()
    )
  );

drop policy if exists picks_insert_self on public.picks;
create policy picks_insert_self
  on public.picks
  for insert
  with check (user_id = auth.uid());

drop policy if exists picks_update_self on public.picks;
create policy picks_update_self
  on public.picks
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notifications
drop policy if exists notifications_read_self on public.notifications;
create policy notifications_read_self
  on public.notifications
  for select
  using (user_id = auth.uid());

drop policy if exists notifications_update_self on public.notifications;
create policy notifications_update_self
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Payouts
drop policy if exists payouts_read_self on public.payouts;
create policy payouts_read_self
  on public.payouts
  for select
  using (user_id = auth.uid());
