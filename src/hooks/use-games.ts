import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
type GameRow = Database["public"]["Tables"]["games"]["Row"];

const GAME_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GAME_CODE_LENGTH = 6;
const MAX_GAME_CODE_ATTEMPTS = 20;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export type CreateGameInput = Pick<
  GameInsert,
  | "currency"
  | "entry_fee"
  | "max_players"
  | "min_players"
  | "name"
  | "pick_visibility"
  | "rebuy_window_days"
  | "starting_round"
  | "visibility"
  | "wipeout_mode"
>;

export interface GameFilters {
  maxEntryFee?: number;
  minEntryFee?: number;
  paymentType?: "all" | "free" | "paid";
  sortBy?: "most_players" | "newest" | "starting_soonest";
  status?: GameRow["status"];
  visibility?: GameRow["visibility"];
  page?: number;
  pageSize?: number;
}

export interface GamesResult {
  games: (GameRow & { player_count?: number })[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}

function generateRandomGameCode() {
  let code = "";

  for (let index = 0; index < GAME_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * GAME_CODE_ALPHABET.length);
    code += GAME_CODE_ALPHABET[randomIndex];
  }

  return code;
}

export async function generateUniqueGameCode() {
  for (let attempt = 0; attempt < MAX_GAME_CODE_ATTEMPTS; attempt += 1) {
    const code = generateRandomGameCode();
    const { data, error } = await supabase
      .from("games")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique game code. Please try again.");
}

async function fetchPublicGames({
  filters,
  page,
  pageSize,
}: {
  filters: GameFilters | undefined;
  page: number;
  pageSize: number;
}): Promise<GamesResult> {
  const { data, error } = await supabase.rpc("list_public_games", {
    p_max_entry_fee: filters?.maxEntryFee,
    p_min_entry_fee: filters?.minEntryFee,
    p_page: page,
    p_page_size: pageSize,
    p_payment_type: filters?.paymentType ?? "all",
    p_sort_by: filters?.sortBy ?? "newest",
    p_status: filters?.status,
  });

  if (error) {
    throw error;
  }

  const total = data?.at(0)?.total_count ?? 0;
  const pageCount = total > 0 ? Math.ceil(total / pageSize) : 1;
  const games = (data ?? []) as unknown as (GameRow & {
    player_count?: number;
  })[];

  return {
    games,
    page,
    pageCount,
    pageSize,
    total,
  } satisfies GamesResult;
}

async function fetchGamesTable({
  filters,
  page,
  pageSize,
}: {
  filters: GameFilters | undefined;
  page: number;
  pageSize: number;
}): Promise<GamesResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("games")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.visibility) {
    query = query.eq("visibility", filters.visibility);
  }

  const { data, error, count } = await query;
  if (error) {
    throw error;
  }

  const total = count ?? 0;
  const pageCount = total > 0 ? Math.ceil(total / pageSize) : 1;

  return {
    games: data ?? [],
    page,
    pageCount,
    pageSize,
    total,
  } satisfies GamesResult;
}

export function useGames(filters?: GameFilters) {
  const page = Math.max(1, Math.floor(filters?.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(filters?.pageSize ?? DEFAULT_PAGE_SIZE))
  );

  return useQuery<GamesResult>({
    queryKey: ["games", filters, page, pageSize],
    queryFn: (): Promise<GamesResult> => {
      if (filters?.visibility === "public") {
        return fetchPublicGames({ filters, page, pageSize });
      }

      return fetchGamesTable({ filters, page, pageSize });
    },
  });
}

export function useCreateGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (game: CreateGameInput) => {
      if (!user) {
        throw new Error("You must be signed in to create a game.");
      }

      const code = await generateUniqueGameCode();
      const { data, error } = await supabase
        .from("games")
        .insert({
          ...game,
          code,
          manager_id: user.id,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
