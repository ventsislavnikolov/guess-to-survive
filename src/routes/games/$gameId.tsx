import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CheckoutSummary } from "@/components/checkout-summary";
import { GameLeaderboard } from "@/components/game-leaderboard";
import { GameInviteShareCard } from "@/components/share/game-invite-share-card";
import { ResultShareCard } from "@/components/share/result-share-card";
import { ShareButtons } from "@/components/share/share-buttons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateCheckout,
  useCreateRebuyCheckout,
  useGame,
  useJoinGame,
  useKickPlayerWithRefund,
  useLeaveGame,
} from "@/hooks/use-game";
import {
  clearCheckoutContext,
  readCheckoutContext,
  track,
} from "@/lib/analytics";
import { setPageMeta } from "@/lib/meta";

export const Route = createFileRoute("/games/$gameId")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.checkout === "string"
      ? { checkout: search.checkout }
      : {}),
    ...(typeof search.rebuy === "string" ? { rebuy: search.rebuy } : {}),
  }),
  component: GameDetailPage,
});

function formatCurrency(value: number | null, currency: string) {
  if (value === null || value === 0) {
    return "Free";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTimeRemaining(targetTimestamp: number | null, now: number) {
  if (targetTimestamp === null || !Number.isFinite(targetTimestamp)) {
    return "Unavailable";
  }

  const diffMs = targetTimestamp - now;
  if (diffMs <= 0) {
    return "Closed";
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function GameDetailPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const { gameId } = Route.useParams();
  const navigate = Route.useNavigate();
  const { checkout, rebuy } = Route.useSearch();
  const { user } = useAuth();
  const { data: game, error, isError, isLoading } = useGame(gameId);
  const createCheckout = useCreateCheckout();
  const createRebuyCheckout = useCreateRebuyCheckout();
  const joinGame = useJoinGame();
  const kickPlayerWithRefund = useKickPlayerWithRefund();
  const leaveGame = useLeaveGame();
  const [kickTargetUserId, setKickTargetUserId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const isPickRoute = pathname.endsWith("/pick");

  useEffect(() => {
    if (isPickRoute) {
      return;
    }

    if (!(checkout || rebuy)) {
      return;
    }

    const checkoutContext = readCheckoutContext(gameId);

    try {
      const storageKey = `gts_checkout_return_tracked_v1:${window.location.href}`;
      const alreadyTracked = window.sessionStorage.getItem(storageKey) === "1";
      if (!alreadyTracked) {
        window.sessionStorage.setItem(storageKey, "1");

        const outcome = checkout ?? rebuy ?? "unknown";
        const paymentType = checkout ? "entry" : "rebuy";

        track("checkout_returned", {
          gameId,
          outcome,
          paymentType,
          isFirstPaid: checkoutContext?.isFirstPaid ?? null,
          currency: checkoutContext?.currency ?? null,
          entryFee: checkoutContext?.entryFee ?? null,
          processingFee: checkoutContext?.processingFee ?? null,
          total: checkoutContext?.total ?? null,
        });

        if (checkout === "success") {
          track("game_joined", {
            gameId,
            paymentType: "paid",
            isFirstPaid: checkoutContext?.isFirstPaid ?? null,
          });

          if (checkoutContext?.isFirstPaid) {
            track("conversion_free_to_paid", {
              gameId,
              currency: checkoutContext.currency,
              entryFee: checkoutContext.entryFee,
              total: checkoutContext.total,
            });
          }
        }
      }
    } catch {
      // Ignore analytics storage errors.
    }

    if (checkout === "success") {
      toast.success("Payment succeeded. Your game entry is being confirmed.");
    } else if (checkout === "cancelled") {
      toast.info("Checkout was cancelled. You can retry anytime.");
    } else if (checkout === "failed") {
      toast.error("Payment failed. Please retry checkout.");
    }

    if (rebuy === "success") {
      toast.success("Rebuy payment succeeded. Your status is being restored.");
    } else if (rebuy === "cancelled") {
      toast.info("Rebuy checkout was cancelled.");
    } else if (rebuy === "failed") {
      toast.error("Rebuy payment failed. Please retry before the deadline.");
    }

    clearCheckoutContext(gameId);

    navigate({
      params: { gameId },
      replace: true,
      search: () => ({}),
      to: "/games/$gameId",
    });
  }, [checkout, gameId, isPickRoute, navigate, rebuy]);

  useEffect(() => {
    if (isPickRoute) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [isPickRoute]);

  useEffect(() => {
    if (isPickRoute) {
      return;
    }

    if (!game) {
      return;
    }

    const entryFeeLabel =
      (game.entry_fee ?? 0) > 0
        ? formatCurrency(game.entry_fee, game.currency)
        : "Free";
    setPageMeta({
      description: `${game.name} • ${entryFeeLabel} • ${game.player_count} players joined`,
      title: `${game.name} | Guess to Survive`,
      url: window.location.href,
    });
  }, [game, isPickRoute]);

  if (isPickRoute) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card/70 p-8">
        <LoadingSpinner label="Loading game details..." />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load game details</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Please try again."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link to="/games">Back to games</Link>
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
              This game does not exist or is not publicly accessible.
            </CardDescription>
          </CardHeader>
        </Card>
        <Button asChild variant="outline">
          <Link to="/games">Back to games</Link>
        </Button>
      </section>
    );
  }

  const isManager = user?.id === game.manager_id;
  const isPlayer = user
    ? game.game_players.some((player) => player.user_id === user.id)
    : false;
  const currentUserPlayer = user
    ? (game.game_players.find((player) => player.user_id === user.id) ?? null)
    : null;
  const isFreeGame = (game.entry_fee ?? 0) === 0;
  const canJoin = Boolean(user) && !isPlayer && game.status === "pending";
  const canJoinFree = canJoin && isFreeGame;
  const canJoinPaid = canJoin && !isFreeGame;
  const canLeave =
    Boolean(user) && isPlayer && !isManager && game.status === "pending";
  const rebuyDeadlineTimestamp = game.rebuy_deadline
    ? new Date(game.rebuy_deadline).getTime()
    : null;
  const rebuyWindowOpen =
    rebuyDeadlineTimestamp !== null &&
    Number.isFinite(rebuyDeadlineTimestamp) &&
    rebuyDeadlineTimestamp > now;
  const canRebuy =
    Boolean(user) &&
    currentUserPlayer?.status === "eliminated" &&
    game.status === "active" &&
    game.wipeout_mode === "rebuy" &&
    (game.entry_fee ?? 0) > 0 &&
    rebuyWindowOpen;
  const isJoinActionPending =
    joinGame.isPending ||
    leaveGame.isPending ||
    createCheckout.isPending ||
    createRebuyCheckout.isPending;
  const canManagePlayers =
    isManager &&
    (game.entry_fee ?? 0) > 0 &&
    (game.status === "active" || game.status === "pending");
  const managedPlayers = game.game_players.filter(
    (player) => player.status !== "kicked" && player.user_id !== game.manager_id
  );

  const gameUrl = window.location.href;
  const inviteText = `Join my Guess to Survive game: ${game.name}`;
  let currentUserShareText = inviteText;
  if (currentUserPlayer?.status === "eliminated") {
    currentUserShareText = `I survived to Round ${currentUserPlayer.eliminated_round ?? "?"} in ${game.name}`;
  } else if (
    game.status === "completed" &&
    currentUserPlayer?.status === "alive"
  ) {
    currentUserShareText = `I won ${game.name} on Guess to Survive`;
  }

  let rebuyNotice = (
    <p className="text-muted-foreground">
      Only eliminated players can use rebuy.
    </p>
  );
  if (currentUserPlayer?.status === "eliminated") {
    rebuyNotice = (
      <p className="text-muted-foreground">
        You are eliminated. Complete payment before the deadline to rejoin this
        game.
      </p>
    );
  } else if (
    currentUserPlayer?.status === "alive" &&
    currentUserPlayer.is_rebuy
  ) {
    rebuyNotice = (
      <p className="text-muted-foreground">Your rebuy is already confirmed.</p>
    );
  }

  const handleJoin = async () => {
    if (!isFreeGame) {
      try {
        const checkoutSession = await createCheckout.mutateAsync(gameId);

        if (!checkoutSession.checkoutUrl) {
          throw new Error("Stripe checkout URL was not returned.");
        }

        window.location.assign(checkoutSession.checkoutUrl);
      } catch (checkoutError) {
        toast.error(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to start checkout."
        );
      }

      return;
    }

    if (
      // biome-ignore lint/suspicious/noAlert: Using native confirm until modal UI is implemented.
      !window.confirm("Join this free game?")
    ) {
      return;
    }

    try {
      await joinGame.mutateAsync(gameId);
      toast.success("You joined the game.");
    } catch (joinError) {
      toast.error(
        joinError instanceof Error ? joinError.message : "Unable to join game."
      );
    }
  };

  const handleRebuy = async () => {
    if (!canRebuy) {
      return;
    }

    if (
      // biome-ignore lint/suspicious/noAlert: Using native confirm until modal UI is implemented.
      !window.confirm("Proceed to Stripe checkout to rebuy into this game?")
    ) {
      return;
    }

    try {
      const checkoutSession = await createRebuyCheckout.mutateAsync(gameId);

      if (!checkoutSession.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.assign(checkoutSession.checkoutUrl);
    } catch (rebuyError) {
      toast.error(
        rebuyError instanceof Error
          ? rebuyError.message
          : "Unable to start rebuy checkout."
      );
    }
  };

  const handleLeave = async () => {
    if (
      // biome-ignore lint/suspicious/noAlert: Using native confirm until modal UI is implemented.
      !window.confirm("Leave this game?")
    ) {
      return;
    }

    try {
      await leaveGame.mutateAsync(gameId);
      toast.success("You left the game.");
    } catch (leaveError) {
      toast.error(
        leaveError instanceof Error
          ? leaveError.message
          : "Unable to leave game."
      );
    }
  };

  const handleKickPlayer = async (targetUserId: string) => {
    if (!canManagePlayers) {
      return;
    }

    const reasonInput =
      // biome-ignore lint/suspicious/noAlert: Using native prompt until modal UI is implemented.
      window.prompt(
        "Enter reason for kicking this player (required):",
        "rule violation"
      );
    if (reasonInput === null) {
      return;
    }

    const reason = reasonInput.trim();
    if (!reason) {
      toast.error("A kick reason is required.");
      return;
    }

    if (
      // biome-ignore lint/suspicious/noAlert: Using native confirm until modal UI is implemented.
      !window.confirm("Kick this player and start refund processing?")
    ) {
      return;
    }

    setKickTargetUserId(targetUserId);
    try {
      const result = await kickPlayerWithRefund.mutateAsync({
        gameId,
        reason,
        userId: targetUserId,
      });

      if (result.processed === 0) {
        toast.info("Player kicked, but no refundable payment was found.");
      } else {
        toast.success("Player kicked and refund processing started.");
      }
    } catch (kickError) {
      toast.error(
        kickError instanceof Error
          ? kickError.message
          : "Unable to kick player."
      );
    } finally {
      setKickTargetUserId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Game detail
          </p>
          <h1 className="mt-1 font-semibold text-2xl text-foreground">
            {game.name}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Code: {game.code ?? "N/A"} • Status: {formatStatus(game.status)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/games">Back to games</Link>
          </Button>
          {user && isPlayer ? (
            <Button asChild variant="secondary">
              <Link params={{ gameId }} search={{}} to="/games/$gameId/pick">
                Make pick
              </Link>
            </Button>
          ) : null}
          {user ? null : (
            <Button asChild>
              <Link to="/auth/login">Sign in to join</Link>
            </Button>
          )}
          {canJoinFree ? (
            <Button disabled={isJoinActionPending} onClick={handleJoin}>
              {joinGame.isPending ? "Joining..." : "Join game"}
            </Button>
          ) : null}
          {canLeave ? (
            <Button
              disabled={isJoinActionPending}
              onClick={handleLeave}
              variant="outline"
            >
              {leaveGame.isPending ? "Leaving..." : "Leave game"}
            </Button>
          ) : null}
          {canRebuy ? (
            <Button disabled={isJoinActionPending} onClick={handleRebuy}>
              {createRebuyCheckout.isPending ? "Redirecting..." : "Rebuy now"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <ShareButtons
          text={currentUserShareText}
          title={game.name}
          url={gameUrl}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <GameInviteShareCard
            code={game.code}
            currency={game.currency}
            entryFee={game.entry_fee}
            name={game.name}
            playerCount={game.player_count}
            status={game.status}
          />
          <ResultShareCard
            eliminatedRound={currentUserPlayer?.eliminated_round ?? null}
            gameName={game.name}
            playerStatus={currentUserPlayer?.status ?? "unknown"}
            status={game.status}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Game info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Entry fee:</span>{" "}
              {formatCurrency(game.entry_fee, game.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Players:</span>{" "}
              {game.player_count} joined
            </p>
            <p>
              <span className="text-muted-foreground">Min/Max:</span>{" "}
              {game.min_players}
              {game.max_players ? ` / ${game.max_players}` : " / No max"}
            </p>
            <p>
              <span className="text-muted-foreground">Starting round:</span>{" "}
              {game.starting_round}
            </p>
            <p>
              <span className="text-muted-foreground">Current round:</span>{" "}
              {game.current_round ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Pick visibility:</span>{" "}
              {formatStatus(game.pick_visibility)}
            </p>
            <p>
              <span className="text-muted-foreground">Wipeout mode:</span>{" "}
              {formatStatus(game.wipeout_mode)}
            </p>
            <p>
              <span className="text-muted-foreground">Rebuy deadline:</span>{" "}
              {game.rebuy_deadline ? formatDateTime(game.rebuy_deadline) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Visibility Rules</CardTitle>
            <CardDescription>
              {game.pick_visibility === "hidden"
                ? "Current-round picks stay hidden for alive players until the deadline."
                : "Current-round picks are visible immediately after submission."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Alive players:</span> past
              picks are visible, current pick respects visibility setting.
            </p>
            <p>
              <span className="text-muted-foreground">Eliminated players:</span>{" "}
              full pick history is visible.
            </p>
          </CardContent>
        </Card>
      </div>

      {canJoinPaid ? (
        <CheckoutSummary
          currency={game.currency}
          entryFee={game.entry_fee ?? 0}
          isPending={createCheckout.isPending}
          onCheckout={handleJoin}
        />
      ) : null}

      {game.status === "active" &&
      game.wipeout_mode === "rebuy" &&
      game.rebuy_deadline ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Rebuy window</CardTitle>
            <CardDescription>
              Rebuy closes at {formatDateTime(game.rebuy_deadline)} (
              {formatTimeRemaining(rebuyDeadlineTimestamp, now)} remaining).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {rebuyNotice}
            {canRebuy ? (
              <Button
                disabled={createRebuyCheckout.isPending}
                onClick={handleRebuy}
              >
                {createRebuyCheckout.isPending
                  ? "Redirecting to checkout..."
                  : "Pay and rebuy"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canManagePlayers ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Manager controls</CardTitle>
            <CardDescription>
              Kick players from paid games and trigger entry refunds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {managedPlayers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No players available for kick actions.
              </p>
            ) : (
              managedPlayers.map((player) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-2"
                  key={player.id}
                >
                  <p className="text-muted-foreground text-sm">
                    Player: {player.user_id.slice(0, 8)} • Status:{" "}
                    {formatStatus(player.status)}
                  </p>
                  <Button
                    disabled={kickPlayerWithRefund.isPending}
                    onClick={() => handleKickPlayer(player.user_id)}
                    size="sm"
                    variant="destructive"
                  >
                    {kickPlayerWithRefund.isPending &&
                    kickTargetUserId === player.user_id
                      ? "Processing..."
                      : "Kick + refund"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            Alive players are ranked first, then eliminated players by rounds
            survived.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GameLeaderboard
            currentRound={game.current_round ?? game.starting_round}
            gameId={gameId}
            pickVisibility={game.pick_visibility}
            players={game.game_players}
            startingRound={game.starting_round}
            viewerUserId={user?.id}
          />
        </CardContent>
      </Card>
    </section>
  );
}
