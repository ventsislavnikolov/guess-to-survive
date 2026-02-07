import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
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
  const updateProfile = useUpdateProfile()
  const [avatarValue, setAvatarValue] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState('')
  const [deletePending, setDeletePending] = useState(false)
  const currentAvatar = avatarValue ?? profile?.avatar_url ?? ''

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
