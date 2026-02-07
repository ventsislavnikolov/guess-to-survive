import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CheckoutSummary } from '@/components/checkout-summary'
import { GameLeaderboard } from '@/components/game-leaderboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { useCreateCheckout, useGame, useJoinGame, useKickPlayerWithRefund, useLeaveGame } from '@/hooks/use-game'

export const Route = createFileRoute('/games/$gameId')({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.checkout === 'string' ? { checkout: search.checkout } : {}),
  }),
  component: GameDetailPage,
})

function formatCurrency(value: number | null, currency: string) {
  if (value === null || value === 0) {
    return 'Free'
  }

  try {
    return new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function GameDetailPage() {
  const { gameId } = Route.useParams()
  const navigate = Route.useNavigate()
  const { checkout } = Route.useSearch()
  const { user } = useAuth()
  const { data: game, error, isError, isLoading } = useGame(gameId)
  const createCheckout = useCreateCheckout()
  const joinGame = useJoinGame()
  const kickPlayerWithRefund = useKickPlayerWithRefund()
  const leaveGame = useLeaveGame()
  const [kickTargetUserId, setKickTargetUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!checkout) {
      return
    }

    if (checkout === 'success') {
      toast.success('Payment succeeded. Your game entry is being confirmed.')
    } else if (checkout === 'cancelled') {
      toast.info('Checkout was cancelled. You can retry anytime.')
    } else if (checkout === 'failed') {
      toast.error('Payment failed. Please retry checkout.')
    }

    navigate({
      params: { gameId },
      replace: true,
      search: () => ({}),
      to: '/games/$gameId',
    })
  }, [checkout, gameId, navigate])

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card/70 p-8">
        <LoadingSpinner label="Loading game details..." />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load game details</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : 'Please try again.'}</CardDescription>
          </CardHeader>
        </Card>
        <Link to="/games">
          <Button variant="outline">Back to games</Button>
        </Link>
      </section>
    )
  }

  if (!game) {
    return (
      <section className="space-y-4">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
            <CardDescription>This game does not exist or is not publicly accessible.</CardDescription>
          </CardHeader>
        </Card>
        <Link to="/games">
          <Button variant="outline">Back to games</Button>
        </Link>
      </section>
    )
  }

  const isManager = user?.id === game.manager_id
  const isPlayer = user ? game.game_players.some((player) => player.user_id === user.id) : false
  const isFreeGame = (game.entry_fee ?? 0) === 0
  const canJoin = Boolean(user) && !isPlayer && game.status === 'pending'
  const canJoinFree = canJoin && isFreeGame
  const canJoinPaid = canJoin && !isFreeGame
  const canLeave = Boolean(user) && isPlayer && !isManager && game.status === 'pending'
  const isJoinActionPending = joinGame.isPending || leaveGame.isPending || createCheckout.isPending
  const canManagePlayers = isManager && (game.entry_fee ?? 0) > 0 && (game.status === 'active' || game.status === 'pending')
  const managedPlayers = game.game_players.filter(
    (player) => player.status !== 'kicked' && player.user_id !== game.manager_id,
  )

  const handleJoin = async () => {
    if (!isFreeGame) {
      try {
        const checkoutSession = await createCheckout.mutateAsync(gameId)

        if (!checkoutSession.checkoutUrl) {
          throw new Error('Stripe checkout URL was not returned.')
        }

        window.location.assign(checkoutSession.checkoutUrl)
      } catch (checkoutError) {
        toast.error(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout.')
      }

      return
    }

    if (!window.confirm('Join this free game?')) {
      return
    }

    try {
      await joinGame.mutateAsync(gameId)
      toast.success('You joined the game.')
    } catch (joinError) {
      toast.error(joinError instanceof Error ? joinError.message : 'Unable to join game.')
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Leave this game?')) {
      return
    }

    try {
      await leaveGame.mutateAsync(gameId)
      toast.success('You left the game.')
    } catch (leaveError) {
      toast.error(leaveError instanceof Error ? leaveError.message : 'Unable to leave game.')
    }
  }

  const handleKickPlayer = async (targetUserId: string) => {
    if (!canManagePlayers) {
      return
    }

    const reasonInput = window.prompt('Enter reason for kicking this player (required):', 'rule violation')
    if (reasonInput === null) {
      return
    }

    const reason = reasonInput.trim()
    if (!reason) {
      toast.error('A kick reason is required.')
      return
    }

    if (!window.confirm('Kick this player and start refund processing?')) {
      return
    }

    setKickTargetUserId(targetUserId)
    try {
      const result = await kickPlayerWithRefund.mutateAsync({
        gameId,
        reason,
        userId: targetUserId,
      })

      if (result.processed === 0) {
        toast.info('Player kicked, but no refundable payment was found.')
      } else {
        toast.success('Player kicked and refund processing started.')
      }
    } catch (kickError) {
      toast.error(kickError instanceof Error ? kickError.message : 'Unable to kick player.')
    } finally {
      setKickTargetUserId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Game detail</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{game.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Code: {game.code ?? 'N/A'} • Status: {formatStatus(game.status)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/games">
            <Button variant="outline">Back to games</Button>
          </Link>
          {user && isPlayer ? (
            <Link params={{ gameId }} search={{}} to="/games/$gameId/pick">
              <Button variant="secondary">Make pick</Button>
            </Link>
          ) : null}
          {!user ? (
            <Link to="/auth/login">
              <Button>Sign in to join</Button>
            </Link>
          ) : null}
          {canJoinFree ? (
            <Button disabled={isJoinActionPending} onClick={handleJoin}>
              {joinGame.isPending ? 'Joining...' : 'Join game'}
            </Button>
          ) : null}
          {canLeave ? (
            <Button disabled={isJoinActionPending} onClick={handleLeave} variant="outline">
              {leaveGame.isPending ? 'Leaving...' : 'Leave game'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Game info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Entry fee:</span> {formatCurrency(game.entry_fee, game.currency)}
            </p>
            <p>
              <span className="text-muted-foreground">Players:</span> {game.player_count} joined
            </p>
            <p>
              <span className="text-muted-foreground">Min/Max:</span> {game.min_players}
              {game.max_players ? ` / ${game.max_players}` : ' / No max'}
            </p>
            <p>
              <span className="text-muted-foreground">Starting round:</span> {game.starting_round}
            </p>
            <p>
              <span className="text-muted-foreground">Current round:</span> {game.current_round ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Pick visibility:</span> {formatStatus(game.pick_visibility)}
            </p>
            <p>
              <span className="text-muted-foreground">Wipeout mode:</span> {formatStatus(game.wipeout_mode)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Visibility Rules</CardTitle>
            <CardDescription>
              {game.pick_visibility === 'hidden'
                ? 'Current-round picks stay hidden for alive players until the deadline.'
                : 'Current-round picks are visible immediately after submission.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Alive players:</span> past picks are visible, current pick
              respects visibility setting.
            </p>
            <p>
              <span className="text-muted-foreground">Eliminated players:</span> full pick history is visible.
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

      {canManagePlayers ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Manager controls</CardTitle>
            <CardDescription>Kick players from paid games and trigger entry refunds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {managedPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players available for kick actions.</p>
            ) : (
              managedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-2"
                >
                  <p className="text-sm text-muted-foreground">
                    Player: {player.user_id.slice(0, 8)} • Status: {formatStatus(player.status)}
                  </p>
                  <Button
                    disabled={kickPlayerWithRefund.isPending}
                    onClick={() => handleKickPlayer(player.user_id)}
                    size="sm"
                    variant="destructive"
                  >
                    {kickPlayerWithRefund.isPending && kickTargetUserId === player.user_id
                      ? 'Processing...'
                      : 'Kick + refund'}
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
          <CardDescription>Alive players are ranked first, then eliminated players by rounds survived.</CardDescription>
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
  )
}
