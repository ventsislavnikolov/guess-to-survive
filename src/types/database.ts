export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      fixtures: {
        Row: {
          away_score: number | null
          away_team_id: number
          created_at: string
          external_id: number | null
          home_score: number | null
          home_team_id: number
          id: number
          kickoff_time: string
          league_id: number
          round: number
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: number
          created_at?: string
          external_id?: number | null
          home_score?: number | null
          home_team_id: number
          id?: number
          kickoff_time: string
          league_id: number
          round: number
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: number
          created_at?: string
          external_id?: number | null
          home_score?: number | null
          home_team_id?: number
          id?: number
          kickoff_time?: string
          league_id?: number
          round?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fixtures_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fixtures_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fixtures_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          },
        ]
      }
      game_players: {
        Row: {
          eliminated_round: number | null
          game_id: string
          id: number
          is_rebuy: boolean
          joined_at: string
          kick_reason: string | null
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          eliminated_round?: number | null
          game_id: string
          id?: number
          is_rebuy?: boolean
          joined_at?: string
          kick_reason?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          eliminated_round?: number | null
          game_id?: string
          id?: number
          is_rebuy?: boolean
          joined_at?: string
          kick_reason?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_players_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_players_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      games: {
        Row: {
          code: string | null
          created_at: string
          currency: string
          current_round: number | null
          entry_fee: number | null
          id: string
          manager_id: string
          max_players: number | null
          min_players: number
          name: string
          pick_visibility: string
          prize_pool: number | null
          rebuy_deadline: string | null
          starting_round: number
          status: string
          updated_at: string
          visibility: string
          wipeout_mode: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          currency?: string
          current_round?: number | null
          entry_fee?: number | null
          id?: string
          manager_id: string
          max_players?: number | null
          min_players?: number
          name: string
          pick_visibility?: string
          prize_pool?: number | null
          rebuy_deadline?: string | null
          starting_round: number
          status?: string
          updated_at?: string
          visibility?: string
          wipeout_mode?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          currency?: string
          current_round?: number | null
          entry_fee?: number | null
          id?: string
          manager_id?: string
          max_players?: number | null
          min_players?: number
          name?: string
          pick_visibility?: string
          prize_pool?: number | null
          rebuy_deadline?: string | null
          starting_round?: number
          status?: string
          updated_at?: string
          visibility?: string
          wipeout_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: 'games_manager_id_fkey'
            columns: ['manager_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      leagues: {
        Row: {
          code: string
          country: string | null
          created_at: string
          current_season: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string
          current_season?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string
          current_season?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: number
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: number
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: number
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          game_id: string
          id: number
          status: string
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          game_id: string
          id?: number
          status?: string
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          game_id?: string
          id?: number
          status?: string
          stripe_transfer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payouts_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payouts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_verified: boolean | null
          id: string
          role: string
          self_excluded_until: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id: string
          role?: string
          self_excluded_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          role?: string
          self_excluded_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      picks: {
        Row: {
          auto_assigned: boolean
          created_at: string
          game_id: string
          id: number
          result: string
          round: number
          team_id: number
          user_id: string
        }
        Insert: {
          auto_assigned?: boolean
          created_at?: string
          game_id: string
          id?: number
          result?: string
          round: number
          team_id: number
          user_id: string
        }
        Update: {
          auto_assigned?: boolean
          created_at?: string
          game_id?: string
          id?: number
          result?: string
          round?: number
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'picks_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'picks_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'picks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          crest_url: string | null
          external_id: number | null
          id: number
          league_id: number
          name: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crest_url?: string | null
          external_id?: number | null
          id?: number
          league_id: number
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crest_url?: string | null
          external_id?: number | null
          id?: number
          league_id?: number
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_league_id_fkey'
            columns: ['league_id']
            isOneToOne: false
            referencedRelation: 'leagues'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          email_verified: boolean | null
          id: string
          role: string
          self_excluded_until: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id: string
          role?: string
          self_excluded_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          role?: string
          self_excluded_until?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
