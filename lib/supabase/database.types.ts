// This file provides TypeScript types for your Supabase database

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at?: string | null
          username: string
          full_name: string | null
          avatar_url: string | null
          website: string | null
          credits: number
          plan_id: string | null
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          username: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          credits?: number
          plan_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          credits?: number
          plan_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
        }
      }
      // Add other tables here as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_status?: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'paused'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]