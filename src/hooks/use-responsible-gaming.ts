import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function useSelfExclusion() {
  const { user } = useAuth();

  return useQuery<Pick<ProfileRow, "self_excluded_until"> | null>({
    enabled: Boolean(user),
    queryKey: ["self-exclusion", user?.id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("self_excluded_until")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ?? { self_excluded_until: null };
    },
  });
}

export function useSetSelfExclusion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (untilIso: string | null) => {
      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ self_excluded_until: untilIso })
        .eq("id", user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-exclusion"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
