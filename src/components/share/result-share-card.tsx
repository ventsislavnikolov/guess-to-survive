import { BadgeCheck, Skull, Trophy } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ResultShareCardProps = {
  eliminatedRound: number | null
  gameName: string
  playerStatus: 'alive' | 'eliminated' | 'kicked' | string
  status: 'active' | 'cancelled' | 'completed' | 'pending' | string
}

export function ResultShareCard({ eliminatedRound, gameName, playerStatus, status }: ResultShareCardProps) {
  const isCompleted = status === 'completed'
  const won = isCompleted && playerStatus === 'alive'
  const eliminated = playerStatus === 'eliminated'

  if (!won && !eliminated) {
    return null
  }

  const title = won ? 'Share your win' : 'Share your run'
  const description = won
    ? 'Post your victory to bring more players into the next pool.'
    : 'Share how far you made it in this survival pool.'

  const icon = won ? <Trophy className="h-5 w-5 text-muted-foreground" /> : <Skull className="h-5 w-5 text-muted-foreground" />
  const headline = won ? `I won ${gameName}` : `I survived to Round ${eliminatedRound ?? '?'} in ${gameName}`
  const subline = won ? 'Guess to Survive' : 'Guess to Survive'

  return (
    <Card className={won ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card/70'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{subline}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{headline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {won ? (
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                Winner
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Skull className="h-4 w-4" />
                Eliminated
              </span>
            )}
            <span>•</span>
            <span className="capitalize">{status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

