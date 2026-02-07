import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']

export function useTeams() {
  return useQuery<TeamRow[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name', { ascending: true })

      if (error) {
        throw error
      }

      return data ?? []
    },
  })
}

export type AvailableTeam = {
  crest_url: string | null
  fixture_id: number
  fixture_kickoff_time: string
  id: number
  is_home: boolean
  name: string
  opponent_name: string
  short_name: string | null
}

export function useAvailableTeams(gameId: string, round: number | null) {
  return useQuery<AvailableTeam[]>({
    enabled: Boolean(gameId) && round !== null,
    queryKey: ['available-teams', gameId, round],
    queryFn: async () => {
      if (round === null) {
        return []
      }

      const { data, error } = await supabase
        .from('fixtures')
        .select(
          `
            id,
            kickoff_time,
            home_team:teams!fixtures_home_team_id_fkey(id, name, short_name, crest_url),
            away_team:teams!fixtures_away_team_id_fkey(id, name, short_name, crest_url)
          `,
        )
        .eq('round', round)
        .order('kickoff_time', { ascending: true })

      if (error) {
        throw error
      }

      const availableTeams: AvailableTeam[] = []

      for (const fixture of data ?? []) {
        if (!fixture.home_team || !fixture.away_team) {
          continue
        }

        availableTeams.push({
          crest_url: fixture.home_team.crest_url,
          fixture_id: fixture.id,
          fixture_kickoff_time: fixture.kickoff_time,
          id: fixture.home_team.id,
          is_home: true,
          name: fixture.home_team.name,
          opponent_name: fixture.away_team.name,
          short_name: fixture.home_team.short_name,
        })

        availableTeams.push({
          crest_url: fixture.away_team.crest_url,
          fixture_id: fixture.id,
          fixture_kickoff_time: fixture.kickoff_time,
          id: fixture.away_team.id,
          is_home: false,
          name: fixture.away_team.name,
          opponent_name: fixture.home_team.name,
          short_name: fixture.away_team.short_name,
        })
      }

      return availableTeams
    },
  })
}
