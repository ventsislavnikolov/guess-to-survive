import { createFileRoute } from '@tanstack/react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/use-notifications'

export const Route = createFileRoute('/notifications')({
  component: NotificationsRoute,
})

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function NotificationTypeLabel({ type }: { type: string }) {
  const label = type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

  return <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
}

function NotificationsRoute() {
  return (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  )
}

function NotificationsPage() {
  const { data, error, isError, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data ?? []
  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return
    }

    try {
      await markAllRead.mutateAsync()
      toast.success('All notifications marked as read.')
    } catch (markAllError) {
      const message = markAllError instanceof Error ? markAllError.message : 'Unable to update notifications.'
      toast.error(message)
    }
  }

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markRead.mutateAsync(notificationId)
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'Unable to update notification.'
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <section className="grid min-h-[40vh] place-items-center">
        <LoadingSpinner label="Loading notifications..." />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Unable to load notifications right now.'}
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Game updates, payment events, and result alerts.</p>
        </div>
        <Button disabled={unreadCount === 0 || markAllRead.isPending} onClick={() => void handleMarkAllRead()}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-border bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">No notifications yet</CardTitle>
            <CardDescription>When game events happen, they will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              className={
                notification.read
                  ? 'border-border bg-card/60'
                  : 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]'
              }
              key={notification.id}
            >
              <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <NotificationTypeLabel type={notification.type} />
                    {!notification.read ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
                        Unread
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                  {notification.body ? <p className="text-sm text-muted-foreground">{notification.body}</p> : null}
                  <p className="text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
                </div>

                {!notification.read ? (
                  <Button
                    disabled={markRead.isPending}
                    onClick={() => void handleMarkRead(notification.id)}
                    size="sm"
                    variant="outline"
                  >
                    Mark read
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
