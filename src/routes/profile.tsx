import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/protected-route'
import { ProfileStatsCard } from '@/components/profile/profile-stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { useCreateConnectAccount, usePaymentHistory, useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useSelfExclusion, useSetSelfExclusion } from '@/hooks/use-responsible-gaming'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/profile')({
  component: ProfileRoute,
})

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const BANNED_USERNAME_PARTS = ['admin', 'support', 'mod', 'fuck', 'shit', 'bitch', 'sex']
const AVATAR_PRESETS = [
  'https://api.dicebear.com/8.x/thumbs/svg?seed=Falcon',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=Tiger',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=Wolf',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=Phoenix',
]
const ACCOUNT_DELETE_CONFIRMATION = 'DELETE'

function getUsernameValidationError(username: string) {
  if (username.length < 3 || username.length > 20) {
    return 'Username must be between 3 and 20 characters.'
  }

  if (!USERNAME_REGEX.test(username)) {
    return 'Username can contain only letters, numbers, and underscores.'
  }

  const normalized = username.toLowerCase()
  if (BANNED_USERNAME_PARTS.some((word) => normalized.includes(word))) {
    return 'Please choose a different username.'
  }

  return null
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) {
    return '-'
  }

  try {
    return new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getPaymentStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getPaymentStatusClass(status: string) {
  if (status === 'succeeded') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  }

  if (status === 'refund_pending') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  }

  if (status === 'refunded') {
    return 'border-sky-500/40 bg-sky-500/10 text-sky-300'
  }

  if (status === 'refund_failed' || status === 'failed') {
    return 'border-destructive/40 bg-destructive/10 text-destructive'
  }

  return 'border-border bg-muted/20 text-muted-foreground'
}

function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfileSettingsPage />
    </ProtectedRoute>
  )
}

function ProfileSettingsPage() {
  const { signOut, user } = useAuth()
  const { data: profile, error, isLoading } = useProfile()
  const createConnectAccount = useCreateConnectAccount()
  const {
    data: paymentHistory,
    error: paymentHistoryError,
    isLoading: isPaymentHistoryLoading,
  } = usePaymentHistory()
  const updateProfile = useUpdateProfile()
  const [avatarValue, setAvatarValue] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const currentAvatar = avatarValue ?? profile?.avatar_url ?? ''
  const { data: selfExclusion } = useSelfExclusion()
  const setSelfExclusion = useSetSelfExclusion()
  const [selfExclusionDays, setSelfExclusionDays] = useState(7)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connect = params.get('connect')

    if (!connect) {
      return
    }

    if (connect === 'complete') {
      toast.success('Stripe payout onboarding completed.')
    } else if (connect === 'refresh') {
      toast.info('Please continue Stripe onboarding to complete payout setup.')
    }

    params.delete('connect')
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
    window.history.replaceState({}, '', nextUrl)
  }, [])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) {
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller.')
      return
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${user.id}/${Date.now()}-${safeName}`

    setAvatarUploading(true)
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path)

      setAvatarValue(publicUrl)
      toast.success('Avatar uploaded.')
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Avatar upload failed.'
      toast.error(message)
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const usernameRaw = String(formData.get('username') ?? '').trim().toLowerCase()
    const avatarRaw = String(formData.get('avatar_url') ?? '').trim()

    try {
      if (usernameRaw) {
        const validationError = getUsernameValidationError(usernameRaw)
        if (validationError) {
          toast.error(validationError)
          return
        }

        const { data: usernameMatches, error: usernameCheckError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', usernameRaw)
          .neq('id', user?.id ?? '')
          .limit(1)

        if (usernameCheckError) {
          throw usernameCheckError
        }

        if (usernameMatches && usernameMatches.length > 0) {
          toast.error('Username is already taken.')
          return
        }
      }

      await updateProfile.mutateAsync({
        avatar_url: avatarRaw || null,
        username: usernameRaw || null,
      })
      toast.success('Profile updated.')
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update profile'
      toast.error(message)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmationValue.trim().toUpperCase() !== ACCOUNT_DELETE_CONFIRMATION) {
      toast.error(`Type ${ACCOUNT_DELETE_CONFIRMATION} to confirm account deletion.`)
      return
    }

    const confirmed = window.confirm(
      'Delete your account permanently? This cannot be undone and you will lose access immediately.',
    )

    if (!confirmed) {
      return
    }

    setDeletePending(true)
    try {
      const { error: deleteError } = await supabase.rpc('delete_my_account')

      if (deleteError) {
        throw deleteError
      }

      toast.success('Account deleted.')
      try {
        await signOut()
      } catch {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete account.'
      toast.error(message)
    } finally {
      setDeletePending(false)
    }
  }

  const handleConnectPayouts = async () => {
    try {
      const result = await createConnectAccount.mutateAsync()

      if (!result.onboardingUrl) {
        throw new Error('Stripe onboarding URL was not returned.')
      }

      window.location.assign(result.onboardingUrl)
    } catch (connectError) {
      const message =
        connectError instanceof Error ? connectError.message : 'Unable to start payout onboarding.'
      toast.error(message)
    }
  }

  const formatDateTimeShort = (value: string | null) => {
    if (!value) {
      return '-'
    }

    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    } catch {
      return value
    }
  }

  const exclusionUntil = selfExclusion?.self_excluded_until ?? null
  const exclusionActive = exclusionUntil ? new Date(exclusionUntil).getTime() > Date.now() : false

  const handleEnableSelfExclusion = async () => {
    const days = Math.max(1, Math.min(365, Math.floor(selfExclusionDays)))
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    if (!window.confirm(`Enable self-exclusion for ${days} day(s)? You won’t be able to join paid games until it expires.`)) {
      return
    }

    try {
      await setSelfExclusion.mutateAsync(until)
      toast.success('Self-exclusion enabled.')
    } catch (exclusionError) {
      toast.error(exclusionError instanceof Error ? exclusionError.message : 'Unable to enable self-exclusion.')
    }
  }

  const handleClearSelfExclusion = async () => {
    if (!window.confirm('Clear self-exclusion?')) {
      return
    }

    try {
      await setSelfExclusion.mutateAsync(null)
      toast.success('Self-exclusion cleared.')
    } catch (exclusionError) {
      toast.error(exclusionError instanceof Error ? exclusionError.message : 'Unable to clear self-exclusion.')
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingSpinner label="Loading profile..." />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-2xl border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Could not load your profile.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <ProfileStatsCard />

      <Card className="border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Responsible gaming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Use self-exclusion if you want to take a break from paid games. Free games remain available.
          </p>
          <div className="rounded-lg border border-border/60 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Self-exclusion</p>
            <p className="mt-2 text-sm">
              Status:{' '}
              {exclusionActive ? (
                <span className="font-semibold text-amber-300">Active until {formatDateTimeShort(exclusionUntil)}</span>
              ) : (
                <span className="font-semibold text-emerald-300">Not active</span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="self-exclusion-days">
                Days
              </label>
              <input
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
                id="self-exclusion-days"
                max={365}
                min={1}
                onChange={(event) => setSelfExclusionDays(Number(event.target.value))}
                step={1}
                type="number"
                value={selfExclusionDays}
              />
              <Button disabled={setSelfExclusion.isPending} onClick={() => void handleEnableSelfExclusion()} size="sm">
                Enable
              </Button>
              <Button
                disabled={setSelfExclusion.isPending || !exclusionUntil}
                onClick={() => void handleClearSelfExclusion()}
                size="sm"
                variant="outline"
              >
                Clear
              </Button>
              <Link className="text-xs text-muted-foreground underline" to="/spending-history">
                View spending history
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/80 text-card-foreground">
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input disabled id="email" type="email" value={profile?.email ?? user?.email ?? ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                maxLength={20}
                minLength={3}
                name="username"
                placeholder="your_username"
                defaultValue={profile?.username ?? ''}
              />
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters/numbers/underscores only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              {currentAvatar ? (
                <img
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-full border border-border object-cover"
                  src={currentAvatar}
                />
              ) : null}
              <Input
                id="avatar_url"
                name="avatar_url"
                placeholder="https://..."
                type="url"
                value={currentAvatar}
                onChange={(event) => setAvatarValue(event.target.value)}
              />
              <Input
                accept="image/png,image/jpeg,image/webp"
                disabled={avatarUploading}
                onChange={handleAvatarUpload}
                type="file"
              />
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((presetUrl) => (
                  <Button
                    key={presetUrl}
                    className="h-9 w-9 overflow-hidden rounded-full p-0"
                    onClick={() => setAvatarValue(presetUrl)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <img alt="Preset avatar" className="h-full w-full object-cover" src={presetUrl} />
                  </Button>
                ))}
              </div>
            </div>

            <Button disabled={updateProfile.isPending} type="submit">
              {updateProfile.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Payout setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect Stripe payouts so you can receive prize money when you win paid games.
          </p>
          <Button disabled={createConnectAccount.isPending} onClick={handleConnectPayouts}>
            {createConnectAccount.isPending ? 'Opening Stripe...' : 'Connect Stripe payouts'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPaymentHistoryLoading ? <LoadingSpinner label="Loading payment history..." /> : null}
          {!isPaymentHistoryLoading && paymentHistoryError ? (
            <p className="text-sm text-destructive">Could not load payment history.</p>
          ) : null}
          {!isPaymentHistoryLoading && !paymentHistoryError && (paymentHistory?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : null}
          {!isPaymentHistoryLoading && !paymentHistoryError
            ? (paymentHistory ?? []).map((payment) => (
                <div key={payment.id} className="space-y-2 rounded-lg border border-border/60 bg-card/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {payment.game_name ?? `Game ${payment.game_id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(payment.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(payment.total_amount, payment.currency)}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getPaymentStatusClass(payment.status)}`}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entry: {formatCurrency(payment.entry_fee, payment.currency)} • Fee:{' '}
                    {formatCurrency(payment.processing_fee, payment.currency)}
                  </p>
                  {payment.refund_requested_at ? (
                    <p className="text-xs text-muted-foreground">
                      Refund requested: {formatDateTime(payment.refund_requested_at)}
                    </p>
                  ) : null}
                  {payment.refunded_at ? (
                    <p className="text-xs text-muted-foreground">
                      Refunded at: {formatDateTime(payment.refunded_at)}
                      {payment.refunded_amount !== null
                        ? ` (${formatCurrency(payment.refunded_amount, payment.currency)})`
                        : ''}
                    </p>
                  ) : null}
                  {payment.refund_failure_reason ? (
                    <p className="text-xs text-destructive">Refund error: {payment.refund_failure_reason}</p>
                  ) : null}
                </div>
              ))
            : null}
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all related data. This action cannot be undone.
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirmation">
              Type {ACCOUNT_DELETE_CONFIRMATION} to confirm
            </Label>
            <Input
              id="delete-account-confirmation"
              placeholder={ACCOUNT_DELETE_CONFIRMATION}
              value={deleteConfirmationValue}
              onChange={(event) => setDeleteConfirmationValue(event.target.value)}
            />
          </div>
          <Button disabled={deletePending} onClick={handleDeleteAccount} variant="destructive">
            {deletePending ? 'Deleting account...' : 'Delete my account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
