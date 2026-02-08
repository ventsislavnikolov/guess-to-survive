import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateGame } from '@/hooks/use-games'

type CreateGameFormState = {
  currency: 'EUR' | 'GBP' | 'USD'
  entryFee: string
  maxPlayers: string
  minPlayers: string
  name: string
  pickVisibility: 'hidden' | 'visible'
  rebuyDeadline: string
  startingRound: string
  visibility: 'private' | 'public'
  wipeoutMode: 'rebuy' | 'split'
}

type ParsedCreateGameValues = {
  currency: 'EUR' | 'GBP' | 'USD'
  entryFee: number
  maxPlayers: number | null
  minPlayers: number
  name: string
  pickVisibility: 'hidden' | 'visible'
  rebuyDeadline: string | null
  startingRound: number
  visibility: 'private' | 'public'
  wipeoutMode: 'rebuy' | 'split'
}

const initialFormState: CreateGameFormState = {
  currency: 'EUR',
  entryFee: '0',
  maxPlayers: '',
  minPlayers: '2',
  name: '',
  pickVisibility: 'hidden',
  rebuyDeadline: '',
  startingRound: '1',
  visibility: 'public',
  wipeoutMode: 'split',
}

export const Route = createFileRoute('/games/create')({
  component: CreateGameRoute,
})

function parseCreateGameValues(form: CreateGameFormState): ParsedCreateGameValues | null {
  const entryFee = Number(form.entryFee)
  const minPlayers = Number(form.minPlayers)
  const maxPlayers = form.maxPlayers.trim().length > 0 ? Number(form.maxPlayers) : null
  const startingRound = Number(form.startingRound)
  const rebuyDeadline = form.rebuyDeadline.trim().length > 0 ? form.rebuyDeadline : null

  if (
    Number.isNaN(entryFee) ||
    Number.isNaN(minPlayers) ||
    (maxPlayers !== null && Number.isNaN(maxPlayers)) ||
    Number.isNaN(startingRound)
  ) {
    return null
  }

  return {
    currency: form.currency,
    entryFee,
    maxPlayers,
    minPlayers,
    name: form.name.trim(),
    pickVisibility: form.pickVisibility,
    rebuyDeadline: rebuyDeadline ? new Date(rebuyDeadline).toISOString() : null,
    startingRound,
    visibility: form.visibility,
    wipeoutMode: form.wipeoutMode,
  }
}

function getValidationError(values: ParsedCreateGameValues): string | null {
  if (values.name.length < 3 || values.name.length > 80) {
    return 'Game name must be between 3 and 80 characters.'
  }

  if (values.entryFee < 0 || values.entryFee > 100) {
    return 'Entry fee must be between 0 and 100.'
  }

  if (values.entryFee > 0 && values.entryFee < 1) {
    return 'Paid games must have an entry fee of at least 1.'
  }

  if (values.minPlayers < 2 || values.minPlayers > 500) {
    return 'Minimum players must be between 2 and 500.'
  }

  if (values.maxPlayers !== null && values.maxPlayers < values.minPlayers) {
    return 'Maximum players must be greater than or equal to minimum players.'
  }

  if (values.maxPlayers !== null && values.maxPlayers > 500) {
    return 'Maximum players cannot exceed 500.'
  }

  if (values.startingRound < 1 || values.startingRound > 38) {
    return 'Starting round must be between 1 and 38.'
  }

  if (values.wipeoutMode === 'rebuy' && !values.rebuyDeadline) {
    return 'Rebuy mode requires a rebuy deadline.'
  }

  return null
}

function CreateGameRoute() {
  return (
    <ProtectedRoute>
      <CreateGamePage />
    </ProtectedRoute>
  )
}

function CreateGamePage() {
  const createGame = useCreateGame()
  const [form, setForm] = useState<CreateGameFormState>(initialFormState)

  const updateField = <K extends keyof CreateGameFormState>(key: K, value: CreateGameFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = parseCreateGameValues(form)
    if (!parsed) {
      toast.error('Invalid form values. Please review your inputs.')
      return
    }

    const validationError = getValidationError(parsed)
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      const game = await createGame.mutateAsync({
        currency: parsed.currency,
        entry_fee: parsed.entryFee,
        max_players: parsed.maxPlayers,
        min_players: parsed.minPlayers,
        name: parsed.name,
        pick_visibility: parsed.pickVisibility,
        rebuy_deadline: parsed.rebuyDeadline,
        starting_round: parsed.startingRound,
        visibility: parsed.visibility,
        wipeout_mode: parsed.wipeoutMode,
      })

      toast.success(`Game created. Invite code: ${game.code ?? 'N/A'}`)
      setForm(initialFormState)
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create game.'
      toast.error(message)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <Card className="border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Create game</CardTitle>
          <CardDescription>Set game rules, invite players, and start your survival pool.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Game name</Label>
              <Input
                id="name"
                maxLength={80}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Weekend Premier League Survival"
                required
                value={form.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="visibility"
                onChange={(event) => updateField('visibility', event.target.value as 'private' | 'public')}
                value={form.visibility}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-fee">Entry fee</Label>
              <Input
                id="entry-fee"
                min="0"
                onChange={(event) => updateField('entryFee', event.target.value)}
                step="0.01"
                type="number"
                value={form.entryFee}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="currency"
                onChange={(event) => updateField('currency', event.target.value as 'EUR' | 'GBP' | 'USD')}
                value={form.currency}
              >
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-players">Minimum players</Label>
              <Input
                id="min-players"
                min="2"
                onChange={(event) => updateField('minPlayers', event.target.value)}
                type="number"
                value={form.minPlayers}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-players">Maximum players</Label>
              <Input
                id="max-players"
                min="2"
                onChange={(event) => updateField('maxPlayers', event.target.value)}
                placeholder="Optional"
                type="number"
                value={form.maxPlayers}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="starting-round">Starting round</Label>
              <Input
                id="starting-round"
                max="38"
                min="1"
                onChange={(event) => updateField('startingRound', event.target.value)}
                type="number"
                value={form.startingRound}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wipeout-mode">Wipeout mode</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="wipeout-mode"
                onChange={(event) => updateField('wipeoutMode', event.target.value as 'rebuy' | 'split')}
                value={form.wipeoutMode}
              >
                <option value="split">Split pot</option>
                <option value="rebuy">Rebuy mode</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pick-visibility">Pick visibility</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                id="pick-visibility"
                onChange={(event) =>
                  updateField('pickVisibility', event.target.value as 'hidden' | 'visible')
                }
                value={form.pickVisibility}
              >
                <option value="hidden">Hidden until lock</option>
                <option value="visible">Always visible</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="rebuy-deadline">Rebuy deadline</Label>
              <Input
                id="rebuy-deadline"
                onChange={(event) => updateField('rebuyDeadline', event.target.value)}
                type="datetime-local"
                value={form.rebuyDeadline}
              />
            </div>

            <div className="flex items-center justify-end gap-2 md:col-span-2">
              <Button disabled={createGame.isPending} type="submit">
                {createGame.isPending ? 'Creating...' : 'Create game'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
