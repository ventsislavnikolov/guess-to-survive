import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useGames } from '@/hooks/use-games'
import { setPageMeta } from '@/lib/meta'

const PAGE_SIZE = 12
const MIN_ENTRY_FEE = 1
const MAX_ENTRY_FEE = 100

type PaymentFilter = 'all' | 'free' | 'paid'
type SortOption = 'most_players' | 'newest' | 'starting_soonest'
type StatusFilter = 'active' | 'all' | 'cancelled' | 'completed' | 'pending'

export const Route = createFileRoute('/games/')({
  component: GamesPage,
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

function GamesPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [minEntryFee, setMinEntryFee] = useState(MIN_ENTRY_FEE)
  const [maxEntryFee, setMaxEntryFee] = useState(MAX_ENTRY_FEE)

  useEffect(() => {
    setPageMeta({
      description: 'Browse public football survival pools and join the next round.',
      title: 'Game browser | Guess to Survive',
      url: window.location.href,
    })
  }, [])

  const { data, error, isError, isFetching, isLoading } = useGames({
    maxEntryFee: paymentFilter === 'paid' ? maxEntryFee : undefined,
    minEntryFee: paymentFilter === 'paid' ? minEntryFee : undefined,
    page,
    pageSize: PAGE_SIZE,
    paymentType: paymentFilter,
    sortBy,
    status: statusFilter === 'all' ? undefined : statusFilter,
    visibility: 'public',
  })

  const games = data?.games ?? []
  const currentPage = data?.page ?? page
  const pageCount = data?.pageCount ?? 1
  const pageStart = data && data.total > 0 ? (currentPage - 1) * data.pageSize + 1 : 0
  const pageEnd = data ? Math.min(currentPage * data.pageSize, data.total) : 0

  const goToPage = (page: number) => {
    setPage(page)
  }

  const updatePaymentFilter = (value: PaymentFilter) => {
    setPaymentFilter(value)
    setPage(1)

    if (value !== 'paid') {
      setMinEntryFee(MIN_ENTRY_FEE)
      setMaxEntryFee(MAX_ENTRY_FEE)
    }
  }

  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value)
    setPage(1)
  }

  const updateSortBy = (value: SortOption) => {
    setSortBy(value)
    setPage(1)
  }

  const updateMinEntryFee = (value: number) => {
    const next = Math.min(value, maxEntryFee)
    setMinEntryFee(next)
    setPage(1)
  }

  const updateMaxEntryFee = (value: number) => {
    const next = Math.max(value, minEntryFee)
    setMaxEntryFee(next)
    setPage(1)
  }

  const resetFilters = () => {
    setPage(1)
    setPaymentFilter('all')
    setStatusFilter('all')
    setSortBy('newest')
    setMinEntryFee(MIN_ENTRY_FEE)
    setMaxEntryFee(MAX_ENTRY_FEE)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Game browser</h1>
          <p className="text-sm text-muted-foreground">Find public games and join the next survival pool.</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && !isLoading ? <LoadingSpinner label="Refreshing games..." size="sm" /> : null}
          {user ? (
            <Button asChild>
              <Link to="/games/create">Create game</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by game type, status, and paid-game entry fee range.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="payment-filter">
              Free or paid
            </label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="payment-filter"
              onChange={(event) => updatePaymentFilter(event.target.value as PaymentFilter)}
              value={paymentFilter}
            >
              <option value="all">All games</option>
              <option value="free">Free only</option>
              <option value="paid">Paid only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="status-filter">
              Status
            </label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="status-filter"
              onChange={(event) => updateStatusFilter(event.target.value as StatusFilter)}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sort-by">
              Sort by
            </label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              id="sort-by"
              onChange={(event) => updateSortBy(event.target.value as SortOption)}
              value={sortBy}
            >
              <option value="newest">Newest</option>
              <option value="most_players">Most players</option>
              <option value="starting_soonest">Starting soonest</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="entry-fee-min">
              Entry fee min {paymentFilter === 'paid' ? `(${minEntryFee})` : ''}
            </label>
            <input
              className="h-9 w-full accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={paymentFilter !== 'paid'}
              id="entry-fee-min"
              max={MAX_ENTRY_FEE}
              min={MIN_ENTRY_FEE}
              onChange={(event) => updateMinEntryFee(Number(event.target.value))}
              step={1}
              type="range"
              value={minEntryFee}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="entry-fee-max">
              Entry fee max {paymentFilter === 'paid' ? `(${maxEntryFee})` : ''}
            </label>
            <input
              className="h-9 w-full accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={paymentFilter !== 'paid'}
              id="entry-fee-max"
              max={MAX_ENTRY_FEE}
              min={MIN_ENTRY_FEE}
              onChange={(event) => updateMaxEntryFee(Number(event.target.value))}
              step={1}
              type="range"
              value={maxEntryFee}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-5">
            <Button onClick={resetFilters} size="sm" variant="outline">
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card className="border-border bg-card/70" key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>Unable to load games</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : 'Please try again.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && !isError && games.length === 0 ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle>No public games yet</CardTitle>
            <CardDescription>Create one to start building your player pool.</CardDescription>
          </CardHeader>
          {user ? (
            <CardContent>
              <Button asChild>
                <Link to="/games/create">Create your first game</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !isError && games.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link className="block" key={game.id} params={{ gameId: game.id }} search={{}} to="/games/$gameId">
                <Card className="border-border bg-card/70 transition hover:border-primary/40 hover:bg-card">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">{game.name}</CardTitle>
                    <CardDescription>Code: {game.code ?? 'N/A'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Entry fee:</span> {formatCurrency(game.entry_fee, game.currency)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status:</span> {formatStatus(game.status)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Round:</span> {game.current_round ?? game.starting_round}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Players:</span> {game.player_count ?? 0} joined | Min{' '}
                      {game.min_players}
                      {game.max_players ? ` / Max ${game.max_players}` : '+'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card/70 p-3">
            <p className="text-sm text-muted-foreground">
              Showing {pageStart}-{pageEnd} of {data?.total ?? 0} public games
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </p>
              <Button
                disabled={currentPage >= pageCount}
                onClick={() => goToPage(currentPage + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
