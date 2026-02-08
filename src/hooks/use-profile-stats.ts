import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export interface ProfileStats {
  gamesPlayed: number;
  gamesWon: number;
  longestStreak: number;
  totalWinnings: number;
  winRate: number;
}

export function useProfileStats() {
  const { user } = useAuth();

  return useQuery<ProfileStats | null>({
    enabled: Boolean(user),
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      if (!user) {
        return null;
      }

      const { data, error } = await supabase.rpc("get_my_profile_stats");

      if (error) {
        throw error;
      }

      const row = data?.at(0);
      if (!row) {
        return {
          gamesPlayed: 0,
          gamesWon: 0,
          longestStreak: 0,
          totalWinnings: 0,
          winRate: 0,
        };
      }

      return {
        gamesPlayed: row.games_played ?? 0,
        gamesWon: row.games_won ?? 0,
        longestStreak: row.longest_streak ?? 0,
        totalWinnings: row.total_winnings ?? 0,
        winRate: row.win_rate ?? 0,
      };
    },
  });
}
