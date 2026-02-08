import posthog from 'posthog-js'

type TrackProperties = Record<string, unknown>

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'

let initialized = false

export function isAnalyticsEnabled() {
  return Boolean(POSTHOG_KEY)
}

export function initAnalytics() {
  if (initialized || !isAnalyticsEnabled()) {
    return
  }

  posthog.init(POSTHOG_KEY as string, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
  })

  initialized = true
}

export function track(event: string, properties?: TrackProperties) {
  if (!isAnalyticsEnabled()) {
    return
  }

  posthog.capture(event, properties)
}

export function trackPageView(location: { href: string; pathname: string; searchStr: string; hash: string }) {
  if (!isAnalyticsEnabled()) {
    return
  }

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path: location.pathname,
    search: location.searchStr,
    hash: location.hash,
    href: location.href,
  })
}

export function identifyUser(userId: string) {
  if (!isAnalyticsEnabled()) {
    return
  }

  posthog.identify(userId)
}

export function resetAnalytics() {
  if (!isAnalyticsEnabled()) {
    return
  }

  posthog.reset()
}

const CHECKOUT_CONTEXT_STORAGE_KEY = 'gts_checkout_context_v1'

type CheckoutContext = {
  createdAt: number
  currency: string
  entryFee: number
  gameId: string
  isFirstPaid: boolean
  paymentType: 'entry' | 'rebuy'
  processingFee: number
  total: number
}

export function storeCheckoutContext(context: CheckoutContext) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as CheckoutContext[]) : []
    const next = [context, ...existing].slice(0, 10)
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage errors (private mode, blocked, etc.).
  }
}

export function readCheckoutContext(gameId: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as CheckoutContext[]) : []
    return existing.find((item) => item.gameId === gameId) ?? null
  } catch {
    return null
  }
}

export function clearCheckoutContext(gameId: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as CheckoutContext[]) : []
    const next = existing.filter((item) => item.gameId !== gameId)
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore.
  }
}

