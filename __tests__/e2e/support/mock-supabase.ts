import type { BrowserContext, Page, Request, Route } from "@playwright/test";

const NOW = new Date("2026-02-18T12:00:00.000Z").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

export const MOCK_SUPABASE_URL = "https://gts-mock.supabase.co";
const MOCK_CHECKOUT_URL = "https://checkout.stripe.test";
const MOCK_ACCESS_TOKEN_PREFIX = "token-";
const MOCK_REFRESH_TOKEN_PREFIX = "refresh-";
const DEFAULT_PASSWORD = "Password123!";
const DEFAULT_USER_ID = "user-1";
const DEFAULT_MANAGER_ID = "manager-1";
const DEFAULT_ALT_USER_ID = "user-2";
const CORS_HEADERS = {
  "access-control-allow-headers":
    "authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer,range",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,HEAD,OPTIONS",
  "access-control-allow-origin": "*",
};

export const AUTH_STORAGE_KEY = "sb-gts-mock-auth-token";

interface MockUser {
  avatar_url: string | null;
  email: string;
  id: string;
  role: string;
  self_excluded_until: string | null;
  username: string | null;
}

interface MockProfile extends MockUser {
  created_at: string;
  email_verified: boolean;
  stripe_connect_id: string | null;
  updated_at: string;
}

interface MockGame {
  code: string | null;
  created_at: string;
  currency: string;
  current_round: number | null;
  entry_fee: number | null;
  id: string;
  manager_id: string;
  max_players: number | null;
  min_players: number;
  name: string;
  pick_visibility: string;
  prize_pool: number | null;
  rebuy_deadline: string | null;
  rebuy_window_days: number;
  starting_round: number;
  status: string;
  updated_at: string;
  visibility: string;
  wipeout_mode: string;
}

interface MockGamePlayer {
  eliminated_round: number | null;
  game_id: string;
  id: number;
  is_rebuy: boolean;
  joined_at: string;
  kick_reason: string | null;
  status: string;
  stripe_payment_id: string | null;
  user_id: string;
}

interface MockNotification {
  body: string | null;
  created_at: string;
  data: Record<string, unknown> | null;
  id: number;
  read: boolean;
  title: string;
  type: string;
  user_id: string;
}

interface MockPayment {
  created_at: string;
  currency: string;
  entry_fee: number;
  game_id: string;
  id: number;
  payment_type: string;
  processing_fee: number;
  rebuy_round: number;
  refund_failure_reason: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  refunded_amount: number | null;
  refunded_at: string | null;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_refund_id: string | null;
  total_amount: number;
  updated_at: string;
  user_id: string;
}

interface MockPick {
  auto_assigned: boolean;
  created_at: string;
  game_id: string;
  id: number;
  result: string;
  round: number;
  team_id: number;
  user_id: string;
}

interface MockTeam {
  crest_url: string | null;
  id: number;
  name: string;
  short_name: string | null;
}

interface MockLeague {
  code: string;
  id: number;
  name: string;
}

interface MockFixture {
  away_score: number | null;
  away_team_id: number;
  home_score: number | null;
  home_team_id: number;
  id: number;
  kickoff_time: string;
  league_id: number;
  round: number;
  status: string;
}

export interface MockSupabaseState {
  fixtures: MockFixture[];
  gamePlayers: MockGamePlayer[];
  games: MockGame[];
  leagues: MockLeague[];
  nextGamePlayerId: number;
  nextGameSuffix: number;
  nextNotificationId: number;
  nextPickId: number;
  notifications: MockNotification[];
  passwordsByEmail: Map<string, string>;
  payments: MockPayment[];
  picks: MockPick[];
  profiles: MockProfile[];
  teams: MockTeam[];
  tokenToUserId: Map<string, string>;
  upcomingRounds: Array<{ lock_time: string; round: number }>;
  users: MockUser[];
}

function isoAt(offsetMs: number) {
  return new Date(NOW + offsetMs).toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getEq(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  return raw?.startsWith("eq.") ? raw.slice(3) : null;
}

function getGtNumber(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  if (!raw?.startsWith("gt.")) {
    return null;
  }

  const parsed = Number(raw.slice(3));
  return Number.isFinite(parsed) ? parsed : null;
}

function getIlike(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  return raw?.startsWith("ilike.") ? raw.slice(6).toLowerCase() : null;
}

function getNeq(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  return raw?.startsWith("neq.") ? raw.slice(4) : null;
}

function getIn(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  if (!(raw?.startsWith("in.(") && raw.endsWith(")"))) {
    return null;
  }

  const values = raw.slice(4, -1);
  if (!values.trim()) {
    return [];
  }

  return values.split(",").map((value) => value.trim());
}

function parseJsonBody<T>(request: Request): T {
  const raw = request.postData();
  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function wantsObject(request: Request) {
  const accept = request.headers().accept ?? "";
  return accept.includes("application/vnd.pgrst.object+json");
}

function getPlayerCount(state: MockSupabaseState, gameId: string) {
  return state.gamePlayers.filter(
    (player) => player.game_id === gameId && player.status !== "kicked"
  ).length;
}

function getAuthUserFromRequest(state: MockSupabaseState, request: Request) {
  const authorization = request.headers().authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length);
  const userId = state.tokenToUserId.get(token);
  if (!userId) {
    return null;
  }

  return state.users.find((user) => user.id === userId) ?? null;
}

function getUserById(state: MockSupabaseState, userId: string) {
  return state.users.find((user) => user.id === userId) ?? null;
}

function toAuthUser(user: MockUser) {
  return {
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    aud: "authenticated",
    confirmed_at: isoAt(-30 * DAY_MS),
    created_at: isoAt(-45 * DAY_MS),
    email: user.email,
    email_confirmed_at: isoAt(-30 * DAY_MS),
    id: user.id,
    identities: [],
    is_anonymous: false,
    last_sign_in_at: isoAt(-1 * DAY_MS),
    phone: "",
    role: "authenticated",
    updated_at: isoAt(-1 * DAY_MS),
    user_metadata: {
      username: user.username,
    },
  };
}

function createSessionForUser(user: MockUser) {
  const expiresIn = 60 * 60;
  const expiresAt = Math.floor((NOW + expiresIn * 1000) / 1000);

  return {
    access_token: `${MOCK_ACCESS_TOKEN_PREFIX}${user.id}`,
    expires_at: expiresAt,
    expires_in: expiresIn,
    refresh_token: `${MOCK_REFRESH_TOKEN_PREFIX}${user.id}`,
    token_type: "bearer",
    user: toAuthUser(user),
  };
}

function calculateCheckout(entryFee: number) {
  const processingFee = Number((entryFee * 0.029 + 0.25).toFixed(2));
  const total = Number((entryFee + processingFee).toFixed(2));

  return {
    entryFee,
    processingFee,
    total,
  };
}

function listPublicGames(
  state: MockSupabaseState,
  argsInput: Record<string, unknown> | null | undefined
) {
  const args =
    argsInput && typeof argsInput === "object"
      ? argsInput
      : ({} as Record<string, unknown>);
  const paymentType = String(args.p_payment_type ?? "all");
  const minEntryFee =
    typeof args.p_min_entry_fee === "number" ? args.p_min_entry_fee : null;
  const maxEntryFee =
    typeof args.p_max_entry_fee === "number" ? args.p_max_entry_fee : null;
  const status = typeof args.p_status === "string" ? args.p_status : null;
  const sortBy = String(args.p_sort_by ?? "newest");
  const page =
    typeof args.p_page === "number" && args.p_page > 0 ? args.p_page : 1;
  const pageSize =
    typeof args.p_page_size === "number" && args.p_page_size > 0
      ? args.p_page_size
      : 12;

  let rows = state.games
    .filter((game) => game.visibility === "public")
    .map((game) => ({
      ...game,
      player_count: getPlayerCount(state, game.id),
    }));

  if (status) {
    rows = rows.filter((row) => row.status === status);
  }

  if (paymentType === "free") {
    rows = rows.filter((row) => (row.entry_fee ?? 0) === 0);
  }

  if (paymentType === "paid") {
    rows = rows.filter((row) => (row.entry_fee ?? 0) > 0);

    if (minEntryFee !== null) {
      rows = rows.filter((row) => (row.entry_fee ?? 0) >= minEntryFee);
    }

    if (maxEntryFee !== null) {
      rows = rows.filter((row) => (row.entry_fee ?? 0) <= maxEntryFee);
    }
  }

  if (sortBy === "most_players") {
    rows = rows.sort((a, b) => b.player_count - a.player_count);
  } else if (sortBy === "starting_soonest") {
    rows = rows.sort((a, b) => a.starting_round - b.starting_round);
  } else {
    rows = rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const totalCount = rows.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return rows.slice(start, end).map((row) => ({
    ...row,
    total_count: totalCount,
  }));
}

function getPublicGameDetail(state: MockSupabaseState, gameId: string) {
  const game = state.games.find((item) => item.id === gameId);
  if (!game) {
    return [];
  }

  return [
    {
      ...game,
      player_count: getPlayerCount(state, game.id),
    },
  ];
}

function getGameNameById(state: MockSupabaseState, gameId: string) {
  return state.games.find((game) => game.id === gameId)?.name ?? null;
}

function toPaymentHistoryRows(state: MockSupabaseState, userId: string) {
  return state.payments
    .filter((payment) => payment.user_id === userId)
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime()
    )
    .map((payment) => ({
      ...payment,
      game_name: getGameNameById(state, payment.game_id),
    }));
}

function toLeaderboardPickRows(state: MockSupabaseState, gameId: string) {
  return state.picks
    .filter((pick) => pick.game_id === gameId)
    .sort((left, right) => left.round - right.round)
    .map((pick) => {
      const team =
        state.teams.find((entry) => entry.id === pick.team_id) ?? null;

      return {
        result: pick.result,
        round: pick.round,
        team:
          team === null
            ? null
            : {
                id: team.id,
                name: team.name,
                short_name: team.short_name,
              },
        team_id: pick.team_id,
        user_id: pick.user_id,
      };
    });
}

function toFixtureRows(state: MockSupabaseState, requestUrl: URL) {
  const roundFilter = getEq(requestUrl.searchParams, "round");
  const statusFilter = getEq(requestUrl.searchParams, "status");
  const limitParam = requestUrl.searchParams.get("limit");
  const orderParam = requestUrl.searchParams.get("order") ?? "kickoff_time.asc";

  let rows = state.fixtures;

  if (roundFilter !== null) {
    rows = rows.filter((fixture) => fixture.round === Number(roundFilter));
  }

  if (statusFilter !== null) {
    rows = rows.filter((fixture) => fixture.status === statusFilter);
  }

  rows = [...rows].sort((left, right) => {
    const leftTime = new Date(left.kickoff_time).getTime();
    const rightTime = new Date(right.kickoff_time).getTime();

    return orderParam.includes("desc")
      ? rightTime - leftTime
      : leftTime - rightTime;
  });

  const limit = limitParam ? Number(limitParam) : null;
  if (limit !== null && Number.isFinite(limit) && limit > 0) {
    rows = rows.slice(0, limit);
  }

  return rows.map((fixture) => {
    const homeTeam = state.teams.find(
      (team) => team.id === fixture.home_team_id
    );
    const awayTeam = state.teams.find(
      (team) => team.id === fixture.away_team_id
    );
    const league = state.leagues.find(
      (entry) => entry.id === fixture.league_id
    );

    return {
      away_score: fixture.away_score,
      away_team: awayTeam
        ? {
            crest_url: awayTeam.crest_url,
            id: awayTeam.id,
            name: awayTeam.name,
            short_name: awayTeam.short_name,
          }
        : null,
      home_score: fixture.home_score,
      home_team: homeTeam
        ? {
            crest_url: homeTeam.crest_url,
            id: homeTeam.id,
            name: homeTeam.name,
            short_name: homeTeam.short_name,
          }
        : null,
      id: fixture.id,
      kickoff_time: fixture.kickoff_time,
      league: league
        ? {
            code: league.code,
            name: league.name,
          }
        : null,
      round: fixture.round,
      status: fixture.status,
    };
  });
}

function authErrorBody(message: string) {
  return {
    error: "invalid_grant",
    error_description: message,
    msg: message,
  };
}

async function fulfillJson(
  route: Route,
  status: number,
  data: unknown,
  headers: Record<string, string> = {}
) {
  await route.fulfill({
    body: JSON.stringify(data),
    contentType: "application/json",
    headers: {
      ...CORS_HEADERS,
      ...headers,
    },
    status,
  });
}

async function handleAuthRoute(
  route: Route,
  request: Request,
  state: MockSupabaseState
) {
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();

  if (method === "OPTIONS") {
    await route.fulfill({
      headers: CORS_HEADERS,
      status: 204,
    });
    return;
  }

  if (path === "/auth/v1/token" && method === "POST") {
    const grantType = url.searchParams.get("grant_type") ?? "password";

    if (grantType === "password") {
      const payload = parseJsonBody<{ email?: string; password?: string }>(
        request
      );
      const email = String(payload.email ?? "").toLowerCase();
      const password = String(payload.password ?? "");

      const expectedPassword = state.passwordsByEmail.get(email);
      if (!expectedPassword || expectedPassword !== password) {
        await fulfillJson(
          route,
          400,
          authErrorBody("Invalid login credentials")
        );
        return;
      }

      const user = state.users.find((entry) => entry.email === email);
      if (!user) {
        await fulfillJson(
          route,
          400,
          authErrorBody("Invalid login credentials")
        );
        return;
      }

      await fulfillJson(route, 200, createSessionForUser(user));
      return;
    }

    const payload = parseJsonBody<{ refresh_token?: string }>(request);
    const refreshToken = payload.refresh_token;

    if (grantType === "refresh_token" && typeof refreshToken === "string") {
      const userId = refreshToken.startsWith(MOCK_REFRESH_TOKEN_PREFIX)
        ? refreshToken.slice(MOCK_REFRESH_TOKEN_PREFIX.length)
        : DEFAULT_USER_ID;
      const user =
        getUserById(state, userId) ?? getUserById(state, DEFAULT_USER_ID);
      await fulfillJson(route, 200, createSessionForUser(user as MockUser));
      return;
    }

    if (grantType === "pkce") {
      const user = getUserById(state, DEFAULT_USER_ID) as MockUser;
      await fulfillJson(route, 200, createSessionForUser(user));
      return;
    }

    await fulfillJson(route, 400, authErrorBody("Unsupported auth flow"));
    return;
  }

  if (path === "/auth/v1/signup" && method === "POST") {
    const payload = parseJsonBody<{ email?: string }>(request);
    const email = String(payload.email ?? "").toLowerCase();

    const existing = state.users.find((user) => user.email === email);
    if (existing) {
      await fulfillJson(route, 400, {
        error: "user_already_exists",
        message: "User already registered",
      });
      return;
    }

    const userId = `signup-${state.users.length + 1}`;
    const user: MockUser = {
      avatar_url: null,
      email,
      id: userId,
      role: "user",
      self_excluded_until: null,
      username: email.split("@")[0] ?? null,
    };

    state.users.push(user);
    state.profiles.push({
      ...user,
      created_at: isoAt(-1 * DAY_MS),
      email_verified: false,
      stripe_connect_id: null,
      updated_at: isoAt(-1 * DAY_MS),
    });
    state.passwordsByEmail.set(email, DEFAULT_PASSWORD);
    state.tokenToUserId.set(`${MOCK_ACCESS_TOKEN_PREFIX}${user.id}`, user.id);

    await fulfillJson(route, 200, {
      session: null,
      user: toAuthUser(user),
    });
    return;
  }

  if (path === "/auth/v1/recover" && method === "POST") {
    await fulfillJson(route, 200, {});
    return;
  }

  if (path === "/auth/v1/verify" && method === "POST") {
    const user = getUserById(state, DEFAULT_USER_ID) as MockUser;
    await fulfillJson(route, 200, {
      session: createSessionForUser(user),
      user: toAuthUser(user),
    });
    return;
  }

  if (path === "/auth/v1/user") {
    const user =
      getAuthUserFromRequest(state, request) ??
      getUserById(state, DEFAULT_USER_ID);

    if (!user) {
      await fulfillJson(route, 401, authErrorBody("Session not found"));
      return;
    }

    await fulfillJson(route, 200, toAuthUser(user));
    return;
  }

  if (path === "/auth/v1/logout" && method === "POST") {
    await route.fulfill({
      headers: CORS_HEADERS,
      status: 204,
    });
    return;
  }

  await fulfillJson(route, 404, {
    error: "not_found",
    message: `Unhandled auth endpoint: ${method} ${path}`,
  });
}

async function handleFunctionsRoute(
  route: Route,
  request: Request,
  state: MockSupabaseState
) {
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();
  const authUser = getAuthUserFromRequest(state, request);

  if (method === "OPTIONS") {
    await route.fulfill({
      headers: CORS_HEADERS,
      status: 204,
    });
    return;
  }

  if (path === "/functions/v1/create-checkout" && method === "POST") {
    const payload = parseJsonBody<{ gameId?: string }>(request);
    const game = state.games.find((entry) => entry.id === payload.gameId);

    if (!(authUser && game)) {
      await fulfillJson(route, 400, {
        error: "Unable to create checkout session.",
      });
      return;
    }

    const breakdown = calculateCheckout(game.entry_fee ?? 0);

    await fulfillJson(route, 200, {
      checkoutUrl: `${MOCK_CHECKOUT_URL}/entry/${game.id}`,
      currency: game.currency,
      entryFee: breakdown.entryFee,
      gameId: game.id,
      processingFee: breakdown.processingFee,
      sessionId: `checkout_${Date.now()}`,
      total: breakdown.total,
    });
    return;
  }

  if (path === "/functions/v1/create-rebuy-checkout" && method === "POST") {
    const payload = parseJsonBody<{ gameId?: string }>(request);
    const game = state.games.find((entry) => entry.id === payload.gameId);

    if (!(authUser && game)) {
      await fulfillJson(route, 400, {
        error: "Unable to create rebuy checkout session.",
      });
      return;
    }

    const breakdown = calculateCheckout(game.entry_fee ?? 0);

    await fulfillJson(route, 200, {
      checkoutUrl: `${MOCK_CHECKOUT_URL}/rebuy/${game.id}`,
      currency: game.currency,
      entryFee: breakdown.entryFee,
      gameId: game.id,
      paymentType: "rebuy",
      processingFee: breakdown.processingFee,
      rebuyRound: game.current_round ?? game.starting_round,
      sessionId: `rebuy_${Date.now()}`,
      total: breakdown.total,
    });
    return;
  }

  if (path === "/functions/v1/submit-pick" && method === "POST") {
    const payload = parseJsonBody<{
      gameId?: string;
      round?: number;
      teamId?: number;
    }>(request);

    if (!(authUser && payload.gameId && payload.round && payload.teamId)) {
      await fulfillJson(route, 400, { error: "Unable to submit pick." });
      return;
    }

    const existing = state.picks.find(
      (pick) =>
        pick.game_id === payload.gameId &&
        pick.user_id === authUser.id &&
        pick.round === payload.round
    );

    if (existing && existing.team_id === payload.teamId) {
      await fulfillJson(route, 200, {
        action: "noop",
        pickId: existing.id,
      });
      return;
    }

    if (existing) {
      existing.team_id = payload.teamId;
      existing.created_at = isoAt(0);
      await fulfillJson(route, 200, {
        action: "updated",
        pickId: existing.id,
      });
      return;
    }

    const created: MockPick = {
      auto_assigned: false,
      created_at: isoAt(0),
      game_id: payload.gameId,
      id: state.nextPickId,
      result: "pending",
      round: payload.round,
      team_id: payload.teamId,
      user_id: authUser.id,
    };

    state.nextPickId += 1;
    state.picks.push(created);

    await fulfillJson(route, 200, {
      action: "created",
      pickId: created.id,
    });
    return;
  }

  if (path === "/functions/v1/create-connect-account" && method === "POST") {
    if (!authUser) {
      await fulfillJson(route, 401, {
        error: "You must be signed in to connect payouts.",
      });
      return;
    }

    await fulfillJson(route, 200, {
      accountId: `acct_${authUser.id}`,
      onboardingUrl: `${MOCK_CHECKOUT_URL}/connect/${authUser.id}`,
    });
    return;
  }

  if (path === "/functions/v1/process-refund" && method === "POST") {
    const payload = parseJsonBody<{
      gameId?: string;
      reason?: string;
      userId?: string;
    }>(request);

    if (!(authUser && payload.gameId && payload.userId)) {
      await fulfillJson(route, 400, {
        error: "Unable to process kick refund.",
      });
      return;
    }

    const player = state.gamePlayers.find(
      (entry) =>
        entry.game_id === payload.gameId &&
        entry.user_id === payload.userId &&
        entry.status !== "kicked"
    );

    if (player) {
      player.status = "kicked";
      player.kick_reason = payload.reason ?? "rule violation";
    }

    const payment = state.payments.find(
      (entry) =>
        entry.game_id === payload.gameId &&
        entry.user_id === payload.userId &&
        entry.status === "succeeded"
    );

    let processed = 0;
    if (payment) {
      payment.status = "refund_pending";
      payment.refund_reason = payload.reason ?? "rule violation";
      payment.refund_requested_at = isoAt(0);
      processed = 1;
    }

    await fulfillJson(route, 200, {
      failed: 0,
      gameId: payload.gameId,
      processed,
      scenario: "kick_player",
      skipped: processed === 0 ? 1 : 0,
    });
    return;
  }

  await fulfillJson(route, 404, {
    error: "not_found",
    message: `Unhandled function endpoint: ${method} ${path}`,
  });
}

async function handleRestRoute(
  route: Route,
  request: Request,
  state: MockSupabaseState
) {
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();
  const authUser = getAuthUserFromRequest(state, request);

  if (method === "OPTIONS") {
    await route.fulfill({
      headers: CORS_HEADERS,
      status: 204,
    });
    return;
  }

  if (path === "/rest/v1/rpc/list_public_games" && method === "POST") {
    const args = parseJsonBody<Record<string, unknown>>(request);
    await fulfillJson(route, 200, listPublicGames(state, args));
    return;
  }

  if (path === "/rest/v1/rpc/get_public_game_detail" && method === "POST") {
    const args = parseJsonBody<{ p_game_id?: string }>(request);
    await fulfillJson(
      route,
      200,
      getPublicGameDetail(state, String(args.p_game_id ?? ""))
    );
    return;
  }

  if (path === "/rest/v1/rpc/list_upcoming_rounds" && method === "POST") {
    await fulfillJson(route, 200, clone(state.upcomingRounds));
    return;
  }

  if (path === "/rest/v1/rpc/get_my_profile_stats" && method === "POST") {
    const userId = authUser?.id ?? DEFAULT_USER_ID;
    const gamesPlayed = state.gamePlayers.filter(
      (entry) => entry.user_id === userId
    ).length;
    const gamesWon = state.gamePlayers.filter(
      (entry) => entry.user_id === userId && entry.status === "alive"
    ).length;

    await fulfillJson(route, 200, [
      {
        games_played: gamesPlayed,
        games_won: gamesWon,
        longest_streak: 4,
        total_winnings: 128.4,
        win_rate: gamesPlayed === 0 ? 0 : (gamesWon / gamesPlayed) * 100,
      },
    ]);
    return;
  }

  if (path === "/rest/v1/rpc/delete_my_account" && method === "POST") {
    if (!authUser) {
      await fulfillJson(route, 401, {
        code: "PGRST301",
        message: "Unauthorized",
      });
      return;
    }

    state.notifications = state.notifications.filter(
      (notification) => notification.user_id !== authUser.id
    );

    await route.fulfill({
      headers: CORS_HEADERS,
      status: 204,
    });
    return;
  }

  if (path === "/rest/v1/games") {
    if (method === "GET") {
      let rows = [...state.games];
      const eqId = getEq(url.searchParams, "id");
      const eqCode = getEq(url.searchParams, "code");
      const inId = getIn(url.searchParams, "id");

      if (eqId !== null) {
        rows = rows.filter((game) => game.id === eqId);
      }

      if (eqCode !== null) {
        rows = rows.filter((game) => game.code === eqCode);
      }

      if (inId !== null) {
        const idSet = new Set(inId);
        rows = rows.filter((game) => idSet.has(game.id));
      }

      if (wantsObject(request)) {
        await fulfillJson(route, 200, rows[0] ?? null);
      } else {
        await fulfillJson(route, 200, rows);
      }
      return;
    }

    if (method === "POST") {
      const payload = parseJsonBody<Partial<MockGame>>(request);
      const created: MockGame = {
        code:
          payload.code ??
          `NEW${state.nextGameSuffix.toString().padStart(3, "0")}`,
        created_at: isoAt(0),
        currency: payload.currency ?? "USD",
        current_round: null,
        entry_fee: payload.entry_fee ?? 0,
        id: `game-created-${state.nextGameSuffix}`,
        manager_id: payload.manager_id ?? DEFAULT_USER_ID,
        max_players: payload.max_players ?? null,
        min_players: payload.min_players ?? 2,
        name: payload.name ?? "New game",
        pick_visibility: payload.pick_visibility ?? "hidden",
        prize_pool: null,
        rebuy_deadline: null,
        rebuy_window_days: payload.rebuy_window_days ?? 2,
        starting_round: payload.starting_round ?? 4,
        status: payload.status ?? "pending",
        updated_at: isoAt(0),
        visibility: payload.visibility ?? "public",
        wipeout_mode: payload.wipeout_mode ?? "split",
      };

      state.nextGameSuffix += 1;
      state.games.push(created);

      state.gamePlayers.push({
        eliminated_round: null,
        game_id: created.id,
        id: state.nextGamePlayerId,
        is_rebuy: false,
        joined_at: isoAt(0),
        kick_reason: null,
        status: "alive",
        stripe_payment_id: null,
        user_id: created.manager_id,
      });
      state.nextGamePlayerId += 1;

      if (wantsObject(request)) {
        await fulfillJson(route, 201, created);
      } else {
        await fulfillJson(route, 201, [created]);
      }
      return;
    }
  }

  if (path === "/rest/v1/game_players") {
    if (method === "GET") {
      let rows = [...state.gamePlayers];
      const gameId = getEq(url.searchParams, "game_id");
      const userId = getEq(url.searchParams, "user_id");

      if (gameId !== null) {
        rows = rows.filter((entry) => entry.game_id === gameId);
      }

      if (userId !== null) {
        rows = rows.filter((entry) => entry.user_id === userId);
      }

      rows = rows.sort(
        (left, right) =>
          new Date(left.joined_at).getTime() -
          new Date(right.joined_at).getTime()
      );

      if (wantsObject(request)) {
        await fulfillJson(route, 200, rows[0] ?? null);
      } else {
        await fulfillJson(route, 200, rows);
      }
      return;
    }

    if (method === "POST") {
      const payload = parseJsonBody<Partial<MockGamePlayer>>(request);
      const created: MockGamePlayer = {
        eliminated_round: null,
        game_id: String(payload.game_id ?? ""),
        id: state.nextGamePlayerId,
        is_rebuy: false,
        joined_at: isoAt(0),
        kick_reason: null,
        status: "alive",
        stripe_payment_id: null,
        user_id: String(payload.user_id ?? ""),
      };

      state.nextGamePlayerId += 1;
      state.gamePlayers.push(created);

      if (wantsObject(request)) {
        await fulfillJson(route, 201, created);
      } else {
        await fulfillJson(route, 201, [created]);
      }
      return;
    }

    if (method === "DELETE") {
      const gameId = getEq(url.searchParams, "game_id");
      const userId = getEq(url.searchParams, "user_id");

      const removed = state.gamePlayers.filter((player) => {
        if (gameId !== null && player.game_id !== gameId) {
          return false;
        }

        if (userId !== null && player.user_id !== userId) {
          return false;
        }

        return true;
      });

      state.gamePlayers = state.gamePlayers.filter(
        (player) => !removed.includes(player)
      );
      await fulfillJson(route, 200, removed);
      return;
    }
  }

  if (path === "/rest/v1/picks" && method === "GET") {
    let rows = [...state.picks];
    const gameId = getEq(url.searchParams, "game_id");
    const userId = getEq(url.searchParams, "user_id");

    if (gameId !== null) {
      rows = rows.filter((pick) => pick.game_id === gameId);
    }

    if (userId !== null) {
      rows = rows.filter((pick) => pick.user_id === userId);
    }

    if (url.searchParams.get("select")?.includes("team:teams")) {
      await fulfillJson(route, 200, toLeaderboardPickRows(state, gameId ?? ""));
      return;
    }

    rows = rows.sort((left, right) => left.round - right.round);
    await fulfillJson(route, 200, rows);
    return;
  }

  if (path === "/rest/v1/notifications") {
    if (method === "GET") {
      const userId = authUser?.id;
      const rows = state.notifications
        .filter((notification) => !userId || notification.user_id === userId)
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime()
        );
      await fulfillJson(route, 200, rows);
      return;
    }

    if (method === "PATCH") {
      const userId = authUser?.id;
      const idFilter = getEq(url.searchParams, "id");
      const readEq = getEq(url.searchParams, "read");

      state.notifications = state.notifications.map((notification) => {
        if (userId && notification.user_id !== userId) {
          return notification;
        }

        if (idFilter !== null && notification.id !== Number(idFilter)) {
          return notification;
        }

        if (readEq !== null && String(notification.read) !== readEq) {
          return notification;
        }

        return { ...notification, read: true };
      });

      await fulfillJson(route, 200, []);
      return;
    }
  }

  if (path === "/rest/v1/profiles") {
    if (method === "GET") {
      let rows = [...state.profiles];
      const idEq = getEq(url.searchParams, "id");
      const idIn = getIn(url.searchParams, "id");
      const ilikeUsername = getIlike(url.searchParams, "username");
      const neqId = getNeq(url.searchParams, "id");

      if (idEq !== null) {
        rows = rows.filter((profile) => profile.id === idEq);
      }

      if (idIn !== null) {
        const idSet = new Set(idIn);
        rows = rows.filter((profile) => idSet.has(profile.id));
      }

      if (ilikeUsername !== null) {
        rows = rows.filter(
          (profile) =>
            String(profile.username ?? "").toLowerCase() === ilikeUsername
        );
      }

      if (neqId !== null) {
        rows = rows.filter((profile) => profile.id !== neqId);
      }

      if (wantsObject(request)) {
        await fulfillJson(route, 200, rows[0] ?? null);
      } else {
        await fulfillJson(route, 200, rows);
      }
      return;
    }

    if (method === "PATCH") {
      const idEq = getEq(url.searchParams, "id");
      const payload = parseJsonBody<Partial<MockProfile>>(request);

      state.profiles = state.profiles.map((profile) => {
        if (idEq !== null && profile.id !== idEq) {
          return profile;
        }

        return {
          ...profile,
          ...payload,
          updated_at: isoAt(0),
        };
      });

      const updated = state.profiles.find((profile) =>
        idEq ? profile.id === idEq : true
      );
      if (wantsObject(request)) {
        await fulfillJson(route, 200, updated ?? null);
      } else {
        await fulfillJson(route, 200, updated ? [updated] : []);
      }
      return;
    }
  }

  if (path === "/rest/v1/users" && method === "GET") {
    let rows = [...state.users];
    const idIn = getIn(url.searchParams, "id");

    if (idIn !== null) {
      const idSet = new Set(idIn);
      rows = rows.filter((user) => idSet.has(user.id));
    }

    await fulfillJson(route, 200, rows);
    return;
  }

  if (path === "/rest/v1/payments") {
    if (method === "HEAD") {
      const userId = getEq(url.searchParams, "user_id");
      const paymentType = getEq(url.searchParams, "payment_type");
      const status = getEq(url.searchParams, "status");
      const gtTotalAmount = getGtNumber(url.searchParams, "total_amount");

      const count = state.payments.filter((payment) => {
        if (userId !== null && payment.user_id !== userId) {
          return false;
        }

        if (paymentType !== null && payment.payment_type !== paymentType) {
          return false;
        }

        if (status !== null && payment.status !== status) {
          return false;
        }

        if (gtTotalAmount !== null && payment.total_amount <= gtTotalAmount) {
          return false;
        }

        return true;
      }).length;

      await route.fulfill({
        body: "",
        headers: {
          ...CORS_HEADERS,
          "content-range": `0-0/${count}`,
        },
        status: 200,
      });
      return;
    }

    if (method === "GET") {
      const userId = getEq(url.searchParams, "user_id") ?? authUser?.id;
      const rows = userId ? toPaymentHistoryRows(state, userId) : [];
      await fulfillJson(route, 200, rows);
      return;
    }
  }

  if (path === "/rest/v1/fixtures" && method === "GET") {
    await fulfillJson(route, 200, toFixtureRows(state, url));
    return;
  }

  await fulfillJson(route, 404, {
    code: "PGRST404",
    message: `Unhandled REST endpoint: ${method} ${path}`,
  });
}

export function createMockSupabaseState(): MockSupabaseState {
  const users: MockUser[] = [
    {
      avatar_url: "https://api.dicebear.com/8.x/thumbs/svg?seed=Striker",
      email: "test@example.com",
      id: DEFAULT_USER_ID,
      role: "user",
      self_excluded_until: null,
      username: "striker",
    },
    {
      avatar_url: "https://api.dicebear.com/8.x/thumbs/svg?seed=Manager",
      email: "manager@example.com",
      id: DEFAULT_MANAGER_ID,
      role: "user",
      self_excluded_until: null,
      username: "manager",
    },
    {
      avatar_url: "https://api.dicebear.com/8.x/thumbs/svg?seed=Rival",
      email: "rival@example.com",
      id: DEFAULT_ALT_USER_ID,
      role: "user",
      self_excluded_until: null,
      username: "rival",
    },
  ];

  const profiles: MockProfile[] = users.map((user, index) => ({
    ...user,
    created_at: isoAt(-(30 + index) * DAY_MS),
    email_verified: true,
    stripe_connect_id: user.id === DEFAULT_MANAGER_ID ? "acct_manager" : null,
    updated_at: isoAt(-1 * DAY_MS),
  }));

  const games: MockGame[] = [
    {
      code: "FREE01",
      created_at: isoAt(-10 * DAY_MS),
      currency: "USD",
      current_round: null,
      entry_fee: 0,
      id: "g-free-1",
      manager_id: DEFAULT_MANAGER_ID,
      max_players: 20,
      min_players: 2,
      name: "Weekend Survival Free Pool",
      pick_visibility: "hidden",
      prize_pool: null,
      rebuy_deadline: null,
      rebuy_window_days: 2,
      starting_round: 4,
      status: "pending",
      updated_at: isoAt(-1 * DAY_MS),
      visibility: "public",
      wipeout_mode: "split",
    },
    {
      code: "PAID01",
      created_at: isoAt(-8 * DAY_MS),
      currency: "USD",
      current_round: null,
      entry_fee: 10,
      id: "g-paid-1",
      manager_id: DEFAULT_MANAGER_ID,
      max_players: 100,
      min_players: 2,
      name: "High Stakes Paid Pool",
      pick_visibility: "visible",
      prize_pool: 120,
      rebuy_deadline: null,
      rebuy_window_days: 2,
      starting_round: 4,
      status: "pending",
      updated_at: isoAt(-1 * DAY_MS),
      visibility: "public",
      wipeout_mode: "split",
    },
    {
      code: "REBUY1",
      created_at: isoAt(-7 * DAY_MS),
      currency: "USD",
      current_round: 5,
      entry_fee: 15,
      id: "g-active-rebuy",
      manager_id: DEFAULT_MANAGER_ID,
      max_players: 100,
      min_players: 2,
      name: "Rebuy Showdown",
      pick_visibility: "hidden",
      prize_pool: 400,
      rebuy_deadline: isoAt(2 * DAY_MS),
      rebuy_window_days: 2,
      starting_round: 4,
      status: "active",
      updated_at: isoAt(-1 * DAY_MS),
      visibility: "public",
      wipeout_mode: "rebuy",
    },
    {
      code: "DONE01",
      created_at: isoAt(-20 * DAY_MS),
      currency: "USD",
      current_round: 7,
      entry_fee: 0,
      id: "g-completed-1",
      manager_id: DEFAULT_MANAGER_ID,
      max_players: null,
      min_players: 2,
      name: "Completed Legends Pool",
      pick_visibility: "visible",
      prize_pool: null,
      rebuy_deadline: null,
      rebuy_window_days: 2,
      starting_round: 1,
      status: "completed",
      updated_at: isoAt(-3 * DAY_MS),
      visibility: "public",
      wipeout_mode: "split",
    },
  ];

  const gamePlayers: MockGamePlayer[] = [
    {
      eliminated_round: null,
      game_id: "g-free-1",
      id: 1,
      is_rebuy: false,
      joined_at: isoAt(-9 * DAY_MS),
      kick_reason: null,
      status: "alive",
      stripe_payment_id: null,
      user_id: DEFAULT_MANAGER_ID,
    },
    {
      eliminated_round: null,
      game_id: "g-paid-1",
      id: 2,
      is_rebuy: false,
      joined_at: isoAt(-8 * DAY_MS),
      kick_reason: null,
      status: "alive",
      stripe_payment_id: null,
      user_id: DEFAULT_MANAGER_ID,
    },
    {
      eliminated_round: null,
      game_id: "g-active-rebuy",
      id: 3,
      is_rebuy: false,
      joined_at: isoAt(-7 * DAY_MS),
      kick_reason: null,
      status: "alive",
      stripe_payment_id: null,
      user_id: DEFAULT_MANAGER_ID,
    },
    {
      eliminated_round: 5,
      game_id: "g-active-rebuy",
      id: 4,
      is_rebuy: false,
      joined_at: isoAt(-6 * DAY_MS),
      kick_reason: null,
      status: "eliminated",
      stripe_payment_id: "pi_rebuy_user",
      user_id: DEFAULT_USER_ID,
    },
    {
      eliminated_round: null,
      game_id: "g-completed-1",
      id: 5,
      is_rebuy: false,
      joined_at: isoAt(-19 * DAY_MS),
      kick_reason: null,
      status: "alive",
      stripe_payment_id: null,
      user_id: DEFAULT_USER_ID,
    },
  ];

  const teams: MockTeam[] = [
    { crest_url: null, id: 101, name: "Arsenal", short_name: "ARS" },
    { crest_url: null, id: 102, name: "Chelsea", short_name: "CHE" },
    { crest_url: null, id: 103, name: "Liverpool", short_name: "LIV" },
    { crest_url: null, id: 104, name: "Tottenham", short_name: "TOT" },
    { crest_url: null, id: 105, name: "Everton", short_name: "EVE" },
    { crest_url: null, id: 106, name: "West Ham", short_name: "WHU" },
  ];

  const leagues: MockLeague[] = [
    {
      code: "PL",
      id: 1,
      name: "Premier League",
    },
  ];

  const fixtures: MockFixture[] = [
    {
      away_score: 1,
      away_team_id: 102,
      home_score: 2,
      home_team_id: 101,
      id: 1,
      kickoff_time: isoAt(-2 * DAY_MS),
      league_id: 1,
      round: 3,
      status: "finished",
    },
    {
      away_score: null,
      away_team_id: 102,
      home_score: null,
      home_team_id: 101,
      id: 2,
      kickoff_time: isoAt(1 * DAY_MS),
      league_id: 1,
      round: 4,
      status: "scheduled",
    },
    {
      away_score: null,
      away_team_id: 104,
      home_score: null,
      home_team_id: 103,
      id: 3,
      kickoff_time: isoAt(1 * DAY_MS + 2 * 60 * 60 * 1000),
      league_id: 1,
      round: 4,
      status: "scheduled",
    },
    {
      away_score: null,
      away_team_id: 106,
      home_score: null,
      home_team_id: 105,
      id: 4,
      kickoff_time: isoAt(2 * DAY_MS),
      league_id: 1,
      round: 5,
      status: "scheduled",
    },
  ];

  const picks: MockPick[] = [
    {
      auto_assigned: false,
      created_at: isoAt(-5 * DAY_MS),
      game_id: "g-active-rebuy",
      id: 1,
      result: "loss",
      round: 5,
      team_id: 101,
      user_id: DEFAULT_USER_ID,
    },
    {
      auto_assigned: false,
      created_at: isoAt(-5 * DAY_MS),
      game_id: "g-active-rebuy",
      id: 2,
      result: "win",
      round: 5,
      team_id: 103,
      user_id: DEFAULT_MANAGER_ID,
    },
  ];

  const notifications: MockNotification[] = [
    {
      body: "Your round 5 pick was processed.",
      created_at: isoAt(-2 * 60 * 60 * 1000),
      data: null,
      id: 1,
      read: false,
      title: "Pick processed",
      type: "pick_result",
      user_id: DEFAULT_USER_ID,
    },
    {
      body: "Rebuy window is open.",
      created_at: isoAt(-1 * 60 * 60 * 1000),
      data: null,
      id: 2,
      read: false,
      title: "Rebuy available",
      type: "rebuy_window",
      user_id: DEFAULT_USER_ID,
    },
    {
      body: "Pool completed successfully.",
      created_at: isoAt(-3 * 60 * 60 * 1000),
      data: null,
      id: 3,
      read: true,
      title: "Game completed",
      type: "game_complete",
      user_id: DEFAULT_USER_ID,
    },
  ];

  const payments: MockPayment[] = [
    {
      created_at: isoAt(-6 * DAY_MS),
      currency: "USD",
      entry_fee: 15,
      game_id: "g-active-rebuy",
      id: 1,
      payment_type: "entry",
      processing_fee: 0.69,
      rebuy_round: 0,
      refund_failure_reason: null,
      refund_reason: null,
      refund_requested_at: null,
      refunded_amount: null,
      refunded_at: null,
      status: "succeeded",
      stripe_checkout_session_id: "cs_test_1",
      stripe_payment_intent_id: "pi_test_1",
      stripe_refund_id: null,
      total_amount: 15.69,
      updated_at: isoAt(-6 * DAY_MS),
      user_id: DEFAULT_USER_ID,
    },
    {
      created_at: isoAt(-3 * DAY_MS),
      currency: "USD",
      entry_fee: 10,
      game_id: "g-paid-1",
      id: 2,
      payment_type: "entry",
      processing_fee: 0.54,
      rebuy_round: 0,
      refund_failure_reason: null,
      refund_reason: "kick_player",
      refund_requested_at: isoAt(-2 * DAY_MS),
      refunded_amount: 10.54,
      refunded_at: isoAt(-1 * DAY_MS),
      status: "refunded",
      stripe_checkout_session_id: "cs_test_2",
      stripe_payment_intent_id: "pi_test_2",
      stripe_refund_id: "re_test_2",
      total_amount: 10.54,
      updated_at: isoAt(-1 * DAY_MS),
      user_id: DEFAULT_USER_ID,
    },
  ];

  const tokenToUserId = new Map<string, string>([
    [`${MOCK_ACCESS_TOKEN_PREFIX}${DEFAULT_USER_ID}`, DEFAULT_USER_ID],
    [`${MOCK_ACCESS_TOKEN_PREFIX}${DEFAULT_MANAGER_ID}`, DEFAULT_MANAGER_ID],
    [`${MOCK_ACCESS_TOKEN_PREFIX}${DEFAULT_ALT_USER_ID}`, DEFAULT_ALT_USER_ID],
  ]);

  const passwordsByEmail = new Map<string, string>([
    ["test@example.com", DEFAULT_PASSWORD],
    ["manager@example.com", DEFAULT_PASSWORD],
    ["rival@example.com", DEFAULT_PASSWORD],
  ]);

  return {
    fixtures,
    gamePlayers,
    games,
    leagues,
    nextGamePlayerId: 100,
    nextGameSuffix: 1,
    nextNotificationId: 100,
    nextPickId: 100,
    notifications,
    passwordsByEmail,
    payments,
    picks,
    profiles,
    teams,
    tokenToUserId,
    upcomingRounds: [
      { lock_time: isoAt(1 * DAY_MS), round: 4 },
      { lock_time: isoAt(2 * DAY_MS), round: 5 },
      { lock_time: isoAt(3 * DAY_MS), round: 6 },
    ],
    users,
  };
}

export async function installSupabaseMocks(
  context: BrowserContext,
  state: MockSupabaseState
) {
  await context.route("**/auth/v1/**", async (route) => {
    try {
      await handleAuthRoute(route, route.request(), state);
    } catch (error) {
      await fulfillJson(route, 500, {
        error: "mock_auth_error",
        message:
          error instanceof Error ? error.message : "Unknown mock auth error",
      });
    }
  });

  await context.route("**/functions/v1/**", async (route) => {
    try {
      await handleFunctionsRoute(route, route.request(), state);
    } catch (error) {
      await fulfillJson(route, 500, {
        error: "mock_function_error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown mock function error",
      });
    }
  });

  await context.route("**/rest/v1/**", async (route) => {
    try {
      await handleRestRoute(route, route.request(), state);
    } catch (error) {
      await fulfillJson(route, 500, {
        error: "mock_rest_error",
        message:
          error instanceof Error ? error.message : "Unknown mock rest error",
      });
    }
  });
}

export async function seedAuthenticatedSession(
  page: Page,
  state: MockSupabaseState,
  userId: string = DEFAULT_USER_ID
) {
  const user = getUserById(state, userId);

  if (!user) {
    throw new Error(`Unknown mock user: ${userId}`);
  }

  const session = createSessionForUser(user);

  await page.addInitScript(
    ({ key, payload }) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    {
      key: AUTH_STORAGE_KEY,
      payload: session,
    }
  );
}
