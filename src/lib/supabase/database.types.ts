export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_by: string | null
          name: string
          phone: string
          photo: string
          title: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          name: string
          phone: string
          photo: string
          title: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          name?: string
          phone?: string
          photo?: string
          title?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          requests_today: number
          requests_total: number
          seller_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          requests_today?: number
          requests_total?: number
          seller_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          requests_today?: number
          requests_total?: number
          seller_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          property_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_full"
            referencedColumns: ["id"]
          },
        ]
      }
      import_feeds: {
        Row: {
          active: boolean
          created_at: string
          format: string
          frequency_minutes: number
          id: string
          last_error: string | null
          last_status: string | null
          last_synced_at: string | null
          name: string | null
          seller_profile_id: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          format?: string
          frequency_minutes?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name?: string | null
          seller_profile_id: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          format?: string
          frequency_minutes?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name?: string | null
          seller_profile_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_feeds_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          buyer_id: string | null
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          property_id: string | null
          score: number | null
          score_details: Json | null
          seller_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          buyer_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          property_id?: string | null
          score?: number | null
          score_details?: Json | null
          seller_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          buyer_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          score?: number | null
          score_details?: Json | null
          seller_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_full"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          agent_id: string | null
          amenities: string[]
          created_at: string | null
          currency: string
          description: string
          embedding: string | null
          entity_id: string
          expires_at: string | null
          external_id: string | null
          featured: boolean
          id: string
          image: string
          images: string[]
          operation_type: string
          price: number
          published_at: string | null
          seller_profile_id: string | null
          source: string
          source_url: string | null
          status: string
          tag: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          amenities?: string[]
          created_at?: string | null
          currency?: string
          description: string
          embedding?: string | null
          entity_id: string
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean
          id?: string
          image: string
          images?: string[]
          operation_type?: string
          price: number
          published_at?: string | null
          seller_profile_id?: string | null
          source?: string
          source_url?: string | null
          status?: string
          tag?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          amenities?: string[]
          created_at?: string | null
          currency?: string
          description?: string
          embedding?: string | null
          entity_id?: string
          expires_at?: string | null
          external_id?: string | null
          featured?: boolean
          id?: string
          image?: string
          images?: string[]
          operation_type?: string
          price?: number
          published_at?: string | null
          seller_profile_id?: string | null
          source?: string
          source_url?: string | null
          status?: string
          tag?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "property_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string
          id: string
          plan_id: number | null
          seller_profile_id: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          plan_id?: number | null
          seller_profile_id?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          plan_id?: number | null
          seller_profile_id?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_id: string | null
          amenities: string[]
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string | null
          currency: string
          description: string
          featured: boolean
          floor: number | null
          id: string
          image: string
          images: string[]
          latitude: number | null
          location: string
          longitude: number | null
          neighborhood: string
          parking: number
          price: number
          sqm: number
          tag: string | null
          title: string
          type: string
          updated_at: string | null
          yearBuilt: number | null
        }
        Insert: {
          agent_id?: string | null
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          city: string
          created_at?: string | null
          currency: string
          description: string
          featured?: boolean
          floor?: number | null
          id?: string
          image: string
          images?: string[]
          latitude?: number | null
          location: string
          longitude?: number | null
          neighborhood: string
          parking?: number
          price: number
          sqm: number
          tag?: string | null
          title: string
          type: string
          updated_at?: string | null
          yearBuilt?: number | null
        }
        Update: {
          agent_id?: string | null
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string | null
          currency?: string
          description?: string
          featured?: boolean
          floor?: number | null
          id?: string
          image?: string
          images?: string[]
          latitude?: number | null
          location?: string
          longitude?: number | null
          neighborhood?: string
          parking?: number
          price?: number
          sqm?: number
          tag?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          yearBuilt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      property_boosts: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_key: string
          price_usd: number
          property_id: string
          seller_id: string
          starts_at: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_key: string
          price_usd: number
          property_id: string
          seller_id: string
          starts_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_key?: string
          price_usd?: number
          property_id?: string
          seller_id?: string
          starts_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      property_entities: {
        Row: {
          address: string | null
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string | null
          floor: number | null
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood: string
          parking: number
          similarity_hash: string | null
          sqm: number
          type: string
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          bathrooms?: number
          bedrooms?: number
          city: string
          created_at?: string | null
          floor?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood: string
          parking?: number
          similarity_hash?: string | null
          sqm: number
          type: string
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string | null
          floor?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string
          parking?: number
          similarity_hash?: string | null
          sqm?: number
          type?: string
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_views: {
        Row: {
          created_at: string
          id: number
          ip_hash: string | null
          property_id: string
          seller_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ip_hash?: string | null
          property_id: string
          seller_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ip_hash?: string | null
          property_id?: string
          seller_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          active: boolean
          created_at: string
          filters: Json
          id: string
          last_notified_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          action: string
          created_at: string
          filters: Json | null
          id: string
          property_id: string | null
          search_query: string | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          filters?: Json | null
          id?: string
          property_id?: string | null
          search_query?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          filters?: Json | null
          id?: string
          property_id?: string | null
          search_query?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_full"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          cedula: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          has_website: boolean | null
          id: string
          max_agents: number | null
          max_properties: number | null
          phone: string | null
          properties_count: number | null
          ruc: string | null
          ruc_verified: boolean | null
          seller_type: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          cedula?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          has_website?: boolean | null
          id?: string
          max_agents?: number | null
          max_properties?: number | null
          phone?: string | null
          properties_count?: number | null
          ruc?: string | null
          ruc_verified?: boolean | null
          seller_type: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          cedula?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          has_website?: boolean | null
          id?: string
          max_agents?: number | null
          max_properties?: number | null
          phone?: string | null
          properties_count?: number | null
          ruc?: string | null
          ruc_verified?: boolean | null
          seller_type?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          event_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          type?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json
          id: number
          is_active: boolean
          max_agents: number
          max_properties: number
          name: string
          plan_type: string
          price_usd: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: number
          is_active?: boolean
          max_agents?: number
          max_properties?: number
          name: string
          plan_type: string
          price_usd?: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: number
          is_active?: boolean
          max_agents?: number
          max_properties?: number
          name?: string
          plan_type?: string
          price_usd?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      properties_full: {
        Row: {
          agent_email: string | null
          agent_id: string | null
          agent_name: string | null
          agent_phone: string | null
          agent_photo: string | null
          agent_title: string | null
          agent_whatsapp: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          entity_id: string | null
          expires_at: string | null
          external_id: string | null
          featured: boolean | null
          floor: number | null
          id: string | null
          image: string | null
          images: string[] | null
          latitude: number | null
          location: string | null
          longitude: number | null
          neighborhood: string | null
          operation_type: string | null
          parking: number | null
          price: number | null
          published_at: string | null
          seller_profile_id: string | null
          source: string | null
          sqm: number | null
          status: string | null
          tag: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          yearBuilt: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "property_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_with_agent: {
        Row: {
          agent_email: string | null
          agent_id: string | null
          agent_name: string | null
          agent_phone: string | null
          agent_photo: string | null
          agent_title: string | null
          agent_whatsapp: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          entity_id: string | null
          expires_at: string | null
          external_id: string | null
          featured: boolean | null
          floor: number | null
          id: string | null
          image: string | null
          images: string[] | null
          latitude: number | null
          location: string | null
          longitude: number | null
          neighborhood: string | null
          operation_type: string | null
          parking: number | null
          price: number | null
          published_at: string | null
          seller_profile_id: string | null
          source: string | null
          sqm: number | null
          status: string | null
          tag: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          yearBuilt: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "property_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_properties_count: {
        Args: { profile_id: string }
        Returns: undefined
      }
      expire_property_boosts: { Args: never; Returns: undefined }
      increment_api_key_usage: {
        Args: { p_key_id: string }
        Returns: number
      }
      increment_properties_count: {
        Args: { profile_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      match_properties: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          bathrooms: number
          bedrooms: number
          featured: boolean
          id: string
          images: string[]
          location: string
          price: number
          similarity: number
          sqm: number
          title: string
          type: string
        }[]
      }
      reset_api_key_daily_counters: { Args: never; Returns: undefined }
      similar_properties: {
        Args: { match_count?: number; source_property_id: string }
        Returns: {
          bathrooms: number
          bedrooms: number
          featured: boolean
          id: string
          images: string[]
          location: string
          price: number
          similarity: number
          sqm: number
          title: string
          type: string
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "agent" | "seller" | "seller_empresa" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "agent", "seller", "seller_empresa", "user"],
    },
  },
} as const
