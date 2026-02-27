import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type PickRow = Database["public"]["Tables"]["picks"]["Row"];

export interface MakePickInput {
  gameId: string;
  round: number;
  teamId: number;
}

export function useMyPicks(gameId: string) {
  const { user } = useAuth();

  return useQuery<PickRow[]>({
    enabled: Boolean(user?.id) && Boolean(gameId),
    queryKey: ["my-picks", gameId, user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("picks")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .order("round", { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useMakePick() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, round, teamId }: MakePickInput) => {
      if (!(user && session?.access_token)) {
        throw new Error("You must be signed in to make picks.");
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const accessToken = currentSession?.access_token ?? session.access_token;
      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const submitPickRequest = async (token: string) =>
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-pick`,
          {
            body: JSON.stringify({ gameId, round, teamId }),
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            method: "POST",
          }
        );

      const parsePayload = async (response: Response) =>
        (await response.json().catch(() => null)) as {
          action?: string;
          code?: number;
          error?: string;
          message?: string;
          pickId?: number;
        } | null;

      let response = await submitPickRequest(accessToken);
      let payload = await parsePayload(response);

      const isInvalidJwt =
        response.status === 401 &&
        payload?.code === 401 &&
        payload?.message === "Invalid JWT";

      if (isInvalidJwt) {
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession?.access_token) {
          throw new Error("Session expired. Please sign in again.");
        }

        response = await submitPickRequest(refreshedSession.access_token);
        payload = await parsePayload(response);
      }

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit pick.");
      }

      return payload as {
        action?: string;
        pickId?: number;
      };
    },
    onSuccess: (payload, { gameId, round, teamId }) => {
      const safePayload = payload as {
        action: "created" | "noop" | "updated";
        pickId?: number;
      };
      track("pick_submitted", {
        action: safePayload.action,
        gameId,
        round,
        teamId,
      });
      queryClient.invalidateQueries({
        queryKey: ["my-picks", gameId, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
