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
          name?: string
          phone?: string
          photo?: string
          title?: string
          updated_at?: string | null
          whatsapp?: string
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
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          property_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      seller_profiles: {
        Row: {
          cedula: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          has_website: boolean | null
          id: string
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
      increment_properties_count: {
        Args: { profile_id: string }
        Returns: undefined
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
