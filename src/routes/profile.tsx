import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'

export const Route = createFileRoute('/profile')({
  component: ProfileRoute,
})

function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfileSettingsPage />
    </ProtectedRoute>
  )
}

function ProfileSettingsPage() {
  const { user } = useAuth()
  const { data: profile, error, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const usernameRaw = String(formData.get('username') ?? '').trim()
    const avatarRaw = String(formData.get('avatar_url') ?? '').trim()

    try {
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
    <Card className="mx-auto w-full max-w-2xl border-border bg-card/80 text-card-foreground">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              placeholder="https://..."
              type="url"
              defaultValue={profile?.avatar_url ?? ''}
            />
          </div>

          <Button disabled={updateProfile.isPending} type="submit">
            {updateProfile.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
