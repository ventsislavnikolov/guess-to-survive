import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type UpcomingRound =
  Database["public"]["Functions"]["list_upcoming_rounds"]["Returns"][number];

export function useUpcomingRounds() {
  return useQuery<UpcomingRound[]>({
    queryKey: ["rounds", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_upcoming_rounds");
      if (error) {
        throw error;
      }

      return (data ?? []) as UpcomingRound[];
    },
    staleTime: 60_000,
  });
}
