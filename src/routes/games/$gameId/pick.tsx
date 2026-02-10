import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, LayoutGrid, List } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGame } from "@/hooks/use-game";
import { useMakePick, useMyPicks } from "@/hooks/use-picks";
import { useAvailableTeams } from "@/hooks/use-teams";

type TeamView = "cards" | "list";

export const Route = createFileRoute("/games/$gameId/pick")({
  component: PickRoute,
});

function formatCountdown(targetTime: Date | null, now: number) {
  if (!targetTime) {
    return "Deadline unavailable";
  }

  const milliseconds = targetTime.getTime() - now;

  if (milliseconds <= 0) {
    return "Round locked";
  }

  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getTeamSelectButtonTone({
  isRoundLocked,
  isSelected,
  isUsed,
}: {
  isRoundLocked: boolean;
  isSelected: boolean;
  isUsed: boolean;
}) {
  if (isSelected) {
    return "border-primary bg-primary/10 text-foreground";
  }

  if (isUsed || isRoundLocked) {
    return "cursor-not-allowed border-border bg-muted/40 text-muted-foreground";
  }

  return "border-border bg-background hover:border-primary/40";
}

function renderListSelectionStatus({
  isRoundLocked,
  isSelected,
  isUsed,
}: {
  isRoundLocked: boolean;
  isSelected: boolean;
  isUsed: boolean;
}) {
  if (isSelected) {
    return <Check className="h-4 w-4 text-primary" />;
  }

  if (isUsed) {
    return "Used";
  }

  if (isRoundLocked) {
    return "Locked";
  }

  return null;
}

function PickRoute() {
  return (
    <ProtectedRoute>
      <PickPage />
    </ProtectedRoute>
  );
}

function PickPage() {
  const { gameId } = Route.useParams();
  const {
    data: game,
    error: gameError,
    isError: isGameError,
    isLoading: isGameLoading,
  } = useGame(gameId);
  const round = game?.current_round ?? game?.starting_round ?? null;
  const {
    data: availableTeams,
    error: teamsError,
    isError: isTeamsError,
    isLoading: isTeamsLoading,
  } = useAvailableTeams(gameId, round);
  const {
    data: myPicks,
    error: picksError,
    isError: isPicksError,
    isLoading: isPicksLoading,
  } = useMyPicks(gameId);
  const makePick = useMakePick();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<TeamView>("cards");
  const [now, setNow] = useState(() => Date.now());

  const filteredTeams = useMemo(() => {
    if (!availableTeams) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableTeams;
    }

    return availableTeams.filter((team) =>
      team.name.toLowerCase().includes(normalizedSearch)
    );
  }, [availableTeams, searchTerm]);

  const selectedTeam =
    availableTeams?.find((team) => team.id === selectedTeamId) ?? null;
  const usedTeamIds = useMemo(
    () => new Set((myPicks ?? []).map((pick) => pick.team_id)),
    [myPicks]
  );
  const roundPick =
    (myPicks ?? []).find((pick) => pick.round === (round ?? -1)) ?? null;
  const roundPickTeam =
    availableTeams?.find((team) => team.id === roundPick?.team_id) ?? null;

  const deadline = useMemo(() => {
    if (!availableTeams || availableTeams.length === 0) {
      return null;
    }

    const earliestKickoff = availableTeams.reduce((earliest, team) => {
      const kickoffValue = new Date(team.fixture_kickoff_time).getTime();
      return kickoffValue < earliest ? kickoffValue : earliest;
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(earliestKickoff)) {
      return null;
    }

    return new Date(earliestKickoff);
  }, [availableTeams]);

  const isRoundLocked = deadline ? deadline.getTime() <= now : false;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  if (isGameLoading || isTeamsLoading || isPicksLoading) {
    return (
      <section className="rounded-xl border border-border bg-card/70 p-8">
        <LoadingSpinner label="Loading pick selection..." />
      </section>
    );
  }

  if (isGameError) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load pick selection</CardTitle>
            <CardDescription>
              {gameError instanceof Error
                ? gameError.message
                : "Please try again."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link to="/games">Back to games</Link>
        </Button>
      </section>
    );
  }

  if (isTeamsError) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load available teams</CardTitle>
            <CardDescription>
              {teamsError instanceof Error
                ? teamsError.message
                : "Please try again."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link params={{ gameId }} search={{}} to="/games/$gameId">
            Back to game
          </Link>
        </Button>
      </section>
    );
  }

  if (isPicksError) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load your picks</CardTitle>
            <CardDescription>
              {picksError instanceof Error
                ? picksError.message
                : "Please try again."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link params={{ gameId }} search={{}} to="/games/$gameId">
            Back to game
          </Link>
        </Button>
      </section>
    );
  }

  if (!game) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
            <CardDescription>
              The game is missing or unavailable.
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link params={{ gameId }} search={{}} to="/games/$gameId">
            Back to game
          </Link>
        </Button>
      </section>
    );
  }

  if (!availableTeams || availableTeams.length === 0) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>No fixtures available</CardTitle>
            <CardDescription>
              Fixtures for this round are not available yet. Please check back
              later.
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link params={{ gameId }} search={{}} to="/games/$gameId">
            Back to game
          </Link>
        </Button>
      </section>
    );
  }

  const roundLabel = game.current_round ?? game.starting_round;

  const formatKickoff = (kickoffTime: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(kickoffTime));
    } catch {
      return kickoffTime;
    }
  };

  let teamSelectionContent: ReactNode;
  if (filteredTeams.length === 0) {
    teamSelectionContent = (
      <p className="text-muted-foreground text-sm">
        No teams match your search.
      </p>
    );
  } else if (view === "cards") {
    teamSelectionContent = (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          const isUsed = usedTeamIds.has(team.id);
          const toneClassName = getTeamSelectButtonTone({
            isRoundLocked,
            isSelected,
            isUsed,
          });

          return (
            <button
              className={`rounded-md border p-3 text-left transition ${toneClassName}`}
              disabled={isUsed || isRoundLocked}
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              type="button"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{team.name}</p>
                {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {team.is_home ? "Home" : "Away"} vs {team.opponent_name}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatKickoff(team.fixture_kickoff_time)}
              </p>
              {isUsed ? (
                <p className="mt-1 text-xs">Already used in a previous round</p>
              ) : null}
              {isRoundLocked ? (
                <p className="mt-1 text-xs">Round locked</p>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  } else {
    teamSelectionContent = (
      <ul className="space-y-2">
        {filteredTeams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          const isUsed = usedTeamIds.has(team.id);
          const toneClassName = getTeamSelectButtonTone({
            isRoundLocked,
            isSelected,
            isUsed,
          });
          const selectionStatus = renderListSelectionStatus({
            isRoundLocked,
            isSelected,
            isUsed,
          });

          return (
            <li key={team.id}>
              <button
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition ${toneClassName}`}
                disabled={isUsed || isRoundLocked}
                onClick={() => setSelectedTeamId(team.id)}
                type="button"
              >
                <span>
                  {team.name}
                  <span className="ml-2 text-muted-foreground text-xs">
                    {team.is_home ? "vs" : "@"} {team.opponent_name}
                  </span>
                </span>
                {selectionStatus}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Make Pick
          </p>
          <h1 className="mt-1 font-semibold text-2xl text-foreground">
            {game.name}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Round {roundLabel} selection
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link params={{ gameId }} search={{}} to="/games/$gameId">
              Back to game
            </Link>
          </Button>
          <Button
            disabled={
              !selectedTeamId ||
              (selectedTeam ? usedTeamIds.has(selectedTeam.id) : false) ||
              makePick.isPending ||
              isRoundLocked
            }
            onClick={async () => {
              if (!selectedTeam || round === null) {
                return;
              }

              if (
                // biome-ignore lint/suspicious/noAlert: Using native confirm until modal UI is implemented.
                !window.confirm(
                  `Confirm ${selectedTeam.name} as your pick for round ${roundLabel}?`
                )
              ) {
                return;
              }

              try {
                const result = await makePick.mutateAsync({
                  gameId,
                  round: roundLabel,
                  teamId: selectedTeam.id,
                });

                if (result.action === "created") {
                  toast.success(`Pick submitted: ${selectedTeam.name}`);
                } else if (result.action === "updated") {
                  toast.success(`Pick updated to: ${selectedTeam.name}`);
                } else {
                  toast.info("That team is already your current pick.");
                }
              } catch (pickError) {
                toast.error(
                  pickError instanceof Error
                    ? pickError.message
                    : "Unable to save your pick."
                );
              }
            }}
          >
            {makePick.isPending ? "Saving..." : "Confirm pick"}
          </Button>
        </div>
      </div>

      {isRoundLocked ? (
        <Card className="border-amber-400/60 bg-amber-500/5">
          <CardContent className="text-sm">
            Round lock is active. Picks cannot be submitted or changed after
            first kickoff.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle>Pick confirmation</CardTitle>
          <CardDescription>
            Review your current round pick and lock deadline before confirming
            changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <p>
            <span className="text-muted-foreground">Current pick:</span>{" "}
            {roundPickTeam?.name ??
              (roundPick ? `Team #${roundPick.team_id}` : "No pick yet")}
          </p>
          <p>
            <span className="text-muted-foreground">Deadline:</span>{" "}
            {deadline
              ? new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(deadline)
              : "Unavailable"}
          </p>
          <p>
            <span className="text-muted-foreground">Time left:</span>{" "}
            {formatCountdown(deadline, now)}
          </p>
          <p className="md:col-span-3">
            <span className="text-muted-foreground">Pick visibility:</span>{" "}
            {game.pick_visibility === "hidden"
              ? "Hidden from other players until the round locks."
              : "Visible to other players immediately after submission."}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/70">
        <CardHeader className="space-y-3">
          <CardTitle>Team selection</CardTitle>
          <CardDescription>
            Select from teams that are playing in the target round. You can
            switch visual mode.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="max-w-sm"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search team..."
              value={searchTerm}
            />
            <div className="inline-flex rounded-md border border-input bg-background p-1">
              <Button
                onClick={() => setView("cards")}
                size="sm"
                variant={view === "cards" ? "default" : "ghost"}
              >
                <LayoutGrid className="mr-1 h-4 w-4" />
                Cards
              </Button>
              <Button
                onClick={() => setView("list")}
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
              >
                <List className="mr-1 h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>{teamSelectionContent}</CardContent>
      </Card>
    </section>
  );
}
