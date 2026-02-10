import type { UpcomingRound } from "@/hooks/use-rounds";

export function getAvailabilityAt(round: UpcomingRound): Date | null {
  if (!round.lock_time) {
    return null;
  }

  const date = new Date(round.lock_time);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFirstAvailableRound(
  rounds: UpcomingRound[] | null | undefined
): UpcomingRound | null {
  if (!rounds || rounds.length === 0) {
    return null;
  }

  // list_upcoming_rounds is ordered by lock_time asc, round asc.
  return rounds[0] ?? null;
}

export function normalizeStartingRound({
  requestedRound,
  upcomingRounds,
}: {
  requestedRound: number | null;
  upcomingRounds: UpcomingRound[] | null | undefined;
}): { startingRound: number; wasBumped: boolean } {
  const first = getFirstAvailableRound(upcomingRounds);
  if (!first) {
    throw new Error("No upcoming rounds available.");
  }

  if (
    requestedRound &&
    upcomingRounds?.some((round) => round.round === requestedRound)
  ) {
    return { startingRound: requestedRound, wasBumped: false };
  }

  return { startingRound: first.round, wasBumped: requestedRound !== null };
}
