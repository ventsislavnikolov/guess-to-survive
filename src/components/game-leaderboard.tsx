import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type GamePlayerRow = Database["public"]["Tables"]["game_players"]["Row"];
type PickRow = Database["public"]["Tables"]["picks"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

type GameLeaderboardPlayer = Pick<
  GamePlayerRow,
  "eliminated_round" | "id" | "joined_at" | "status" | "user_id"
>;
type Identity =
  | Pick<ProfileRow, "avatar_url" | "id" | "username">
  | Pick<UserRow, "avatar_url" | "id" | "username">;
type PickWithTeam = Pick<
  PickRow,
  "result" | "round" | "team_id" | "user_id"
> & {
  team:
    | Pick<TeamRow, "id" | "name" | "short_name">
    | Pick<TeamRow, "id" | "name" | "short_name">[]
    | null;
};
interface LeaderboardPick {
  result: string;
  round: number;
  team_id: number;
  team_name: string;
  team_short_name: string | null;
}

interface GameLeaderboardProps {
  currentRound: number;
  gameId: string;
  pickVisibility: string;
  players: GameLeaderboardPlayer[];
  startingRound: number;
  viewerUserId?: string;
}

type LeaderboardRow = GameLeaderboardPlayer & {
  avatar_url: string | null;
  display_name: string;
  picks: LeaderboardPick[];
  rounds_survived: number;
  username: string | null;
};

function formatStatus(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTeam(pick: LeaderboardPick) {
  return pick.team_short_name ?? pick.team_name;
}

function isPickVisible({
  currentRound,
  pickRound,
  pickVisibility,
  status,
}: {
  currentRound: number;
  pickRound: number;
  pickVisibility: string;
  status: string;
}) {
  if (status !== "alive") {
    return true;
  }

  if (pickRound < currentRound) {
    return true;
  }

  if (pickRound > currentRound) {
    return false;
  }

  return pickVisibility === "visible";
}

function getPlayerName(username: string | null, userId: string) {
  const normalized = username?.trim();
  if (normalized) {
    return normalized;
  }

  return `Player ${userId.slice(0, 8)}`;
}

function resolveTeam(team: PickWithTeam["team"]) {
  if (!team) {
    return null;
  }

  return Array.isArray(team) ? (team.at(0) ?? null) : team;
}

function getStatusBadgeClass(status: string) {
  if (status === "alive") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }

  if (status === "eliminated") {
    return "border-rose-500/40 bg-rose-500/15 text-rose-300";
  }

  return "border-border bg-muted/40 text-muted-foreground";
}

function renderCurrentPick({
  canSeeCurrentPick,
  currentPick,
}: {
  canSeeCurrentPick: boolean;
  currentPick: LeaderboardPick | null;
}) {
  if (!currentPick) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (canSeeCurrentPick) {
    return (
      <span className="font-medium text-foreground">
        {formatTeam(currentPick)}
      </span>
    );
  }

  return <span className="text-muted-foreground">Hidden</span>;
}

export function GameLeaderboard({
  currentRound,
  gameId,
  pickVisibility,
  players,
  startingRound,
  viewerUserId,
}: GameLeaderboardProps) {
  const playerIds = useMemo(
    () => [...new Set(players.map((player) => player.user_id))],
    [players]
  );
  const playersCacheKey = useMemo(() => playerIds.join(","), [playerIds]);

  const { data, error, isError, isLoading } = useQuery({
    enabled: Boolean(gameId) && playerIds.length > 0,
    queryKey: ["leaderboard", gameId, playersCacheKey],
    queryFn: async () => {
      const { data: picksData, error: picksError } = await supabase
        .from("picks")
        .select(
          "result, round, team_id, user_id, team:teams(id, name, short_name)"
        )
        .eq("game_id", gameId)
        .order("round", { ascending: true });

      if (picksError) {
        throw picksError;
      }

      let identities: Identity[] = [];

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("avatar_url, id, username")
        .in("id", playerIds);

      if (usersError) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("avatar_url, id, username")
          .in("id", playerIds);

        if (profilesError) {
          throw usersError;
        }

        identities = profilesData ?? [];
      } else {
        identities = usersData ?? [];
      }

      const picksByUser = new Map<string, LeaderboardPick[]>();

      for (const pick of (picksData ?? []) as PickWithTeam[]) {
        const team = resolveTeam(pick.team);
        if (!team) {
          continue;
        }

        const playerPicks = picksByUser.get(pick.user_id) ?? [];
        playerPicks.push({
          result: pick.result,
          round: pick.round,
          team_id: pick.team_id,
          team_name: team.name,
          team_short_name: team.short_name,
        });
        picksByUser.set(pick.user_id, playerPicks);
      }

      const identitiesById = new Map(
        identities.map((identity) => [identity.id, identity])
      );

      return { identitiesById, picksByUser };
    },
  });

  const rows = useMemo<LeaderboardRow[]>(() => {
    const picksByUser =
      data?.picksByUser ?? new Map<string, LeaderboardPick[]>();
    const identitiesById = data?.identitiesById ?? new Map<string, Identity>();

    return [...players]
      .map((player) => {
        const identity = identitiesById.get(player.user_id);
        const roundsSurvived = Math.max(
          0,
          (player.eliminated_round ?? currentRound) - startingRound
        );
        const picks = picksByUser.get(player.user_id) ?? [];

        return {
          ...player,
          avatar_url: identity?.avatar_url ?? null,
          display_name: getPlayerName(
            identity?.username ?? null,
            player.user_id
          ),
          picks,
          rounds_survived: roundsSurvived,
          username: identity?.username ?? null,
        };
      })
      .sort((a, b) => {
        const aAlive = a.status === "alive";
        const bAlive = b.status === "alive";

        if (aAlive !== bAlive) {
          return aAlive ? -1 : 1;
        }

        if (a.rounds_survived !== b.rounds_survived) {
          return b.rounds_survived - a.rounds_survived;
        }

        const aName = (a.username ?? a.display_name).toLowerCase();
        const bName = (b.username ?? b.display_name).toLowerCase();
        return aName.localeCompare(bName);
      });
  }, [currentRound, data, players, startingRound]);

  if (players.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No players have joined this game yet.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="py-4">
        <LoadingSpinner label="Loading leaderboard..." />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : "Unable to load leaderboard."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Rank
            </th>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Player
            </th>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Rounds Survived
            </th>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Current Pick
            </th>
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Teams Used
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => {
            const currentPick =
              row.picks.find((pick) => pick.round === currentRound) ?? null;
            const canSeeCurrentPick =
              currentPick !== null &&
              isPickVisible({
                currentRound,
                pickRound: currentPick.round,
                pickVisibility,
                status: row.status,
              });

            const visiblePicks = row.picks.filter((pick) =>
              isPickVisible({
                currentRound,
                pickRound: pick.round,
                pickVisibility,
                status: row.status,
              })
            );

            const hasHiddenCurrentPick =
              currentPick !== null && !canSeeCurrentPick;
            const name =
              viewerUserId === row.user_id ? "You" : row.display_name;
            const initial = row.display_name.charAt(0).toUpperCase();
            const statusBadgeClass = getStatusBadgeClass(row.status);

            return (
              <tr className="align-top" key={row.id}>
                <td className="px-3 py-3 font-medium text-foreground">
                  {index + 1}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {row.avatar_url ? (
                      <img
                        alt={row.display_name}
                        className="h-7 w-7 rounded-full border border-border object-cover"
                        height={28}
                        src={row.avatar_url}
                        width={28}
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/50 font-medium text-muted-foreground text-xs">
                        {initial}
                      </span>
                    )}
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{name}</p>
                      {viewerUserId === row.user_id ? (
                        <p className="text-muted-foreground text-xs">
                          {row.display_name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 font-medium text-xs",
                      statusBadgeClass
                    )}
                  >
                    {formatStatus(row.status)}
                  </span>
                </td>
                <td className="px-3 py-3 text-foreground">
                  {row.rounds_survived}
                </td>
                <td className="px-3 py-3">
                  {renderCurrentPick({ canSeeCurrentPick, currentPick })}
                </td>
                <td className="px-3 py-3">
                  {visiblePicks.length === 0 ? (
                    <span className="text-muted-foreground">
                      {hasHiddenCurrentPick ? "Current pick hidden" : "-"}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {visiblePicks.map((pick) => (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-foreground text-xs"
                          key={`${row.id}-${pick.round}`}
                        >
                          {formatTeam(pick)}
                          <span className="text-muted-foreground">
                            R{pick.round}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
