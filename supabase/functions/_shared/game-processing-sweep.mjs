/**
 * Returns true for game statuses that still require round/result processing.
 */
export function shouldProcessGameStatus(status) {
  return status === "pending" || status === "active";
}

/**
 * Resolve the round to process for a game.
 */
export function resolveGameRound(game) {
  if (
    typeof game.current_round === "number" &&
    Number.isFinite(game.current_round)
  ) {
    return Math.floor(game.current_round);
  }

  if (
    typeof game.starting_round === "number" &&
    Number.isFinite(game.starting_round)
  ) {
    return Math.floor(game.starting_round);
  }

  return null;
}

/**
 * Build sweep targets from open games.
 */
export function buildGameSweepTargets(games) {
  const targets = [];

  for (const game of games ?? []) {
    if (!shouldProcessGameStatus(game.status)) {
      continue;
    }

    const round = resolveGameRound(game);
    if (!(typeof round === "number" && round >= 1)) {
      continue;
    }

    targets.push({
      gameId: game.id,
      round,
    });
  }

  return targets;
}
