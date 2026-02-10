-- Add per-game rebuy window configuration (in days).
-- This is used to compute games.rebuy_deadline dynamically when a wipeout opens rebuy.

alter table public.games
  add column if not exists rebuy_window_days integer not null default 2;

alter table public.games
  drop constraint if exists games_rebuy_window_days_check;

alter table public.games
  add constraint games_rebuy_window_days_check
  check (rebuy_window_days >= 1 and rebuy_window_days <= 14);

