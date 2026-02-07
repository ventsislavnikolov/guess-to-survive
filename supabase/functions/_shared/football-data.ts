const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const FOOTBALL_DATA_RATE_LIMIT_PER_MINUTE = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const DEFAULT_RETRIES = 2
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

let windowStartedAt = Date.now()
let requestCount = 0

type DenoEnv = {
  get: (name: string) => string | undefined
}

type DenoGlobal = {
  env: DenoEnv
}

type FootballDataRequestOptions = {
  method?: 'GET'
  query?: Record<string, boolean | number | string | undefined>
  retries?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getEnv(name: string): string {
  const deno = (globalThis as { Deno?: DenoGlobal }).Deno
  const value = deno?.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) {
    return null
  }

  const retrySeconds = Number(value)
  if (!Number.isNaN(retrySeconds) && retrySeconds > 0) {
    return retrySeconds * 1000
  }

  const retryDateMs = Date.parse(value)
  if (!Number.isNaN(retryDateMs)) {
    return Math.max(0, retryDateMs - Date.now())
  }

  return null
}

function buildUrl(path: string, query?: FootballDataRequestOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${FOOTBALL_DATA_BASE_URL}${normalizedPath}`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  return url
}

async function reserveRateLimitSlot() {
  while (true) {
    const now = Date.now()

    if (now - windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      windowStartedAt = now
      requestCount = 0
    }

    if (requestCount < FOOTBALL_DATA_RATE_LIMIT_PER_MINUTE) {
      requestCount += 1
      return
    }

    const waitMs = RATE_LIMIT_WINDOW_MS - (now - windowStartedAt)
    await sleep(Math.max(waitMs, 50))
  }
}

export async function footballDataRequest<T = unknown>(
  path: string,
  options: FootballDataRequestOptions = {},
): Promise<T> {
  const { method = 'GET', query, retries = DEFAULT_RETRIES } = options
  const apiKey = getEnv('FOOTBALL_DATA_API_KEY')
  const url = buildUrl(path, query)

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await reserveRateLimitSlot()

    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'X-Auth-Token': apiKey,
      },
    })

    if (response.ok) {
      return (await response.json()) as T
    }

    if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < retries) {
      const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
      const fallbackBackoffMs = 500 * 2 ** attempt
      await sleep(retryAfterMs ?? fallbackBackoffMs)
      continue
    }

    const body = await response.text()
    throw new Error(
      `football-data request failed (${response.status} ${response.statusText}): ${body.slice(0, 200)}`,
    )
  }

  throw new Error('football-data request exhausted all retries')
}

export const footballDataRateLimit = {
  perMinute: FOOTBALL_DATA_RATE_LIMIT_PER_MINUTE,
  windowMs: RATE_LIMIT_WINDOW_MS,
} as const
