export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      completion_rates_by_field: {
        Row: {
          field: string | null
          total_sessions: number | null
          completed_sessions: number | null
          completion_rate_percent: number | null
        }
        Insert: {
          field?: string | null
          total_sessions?: number | null
          completed_sessions?: number | null
          completion_rate_percent?: number | null
        }
        Update: {
          field?: string | null
          total_sessions?: number | null
          completed_sessions?: number | null
          completion_rate_percent?: number | null
        }
        Relationships: []
      }
      graph_data: {
        Row: {
          created_at: string
          edges: Json | null
          id: string
          metadata: Json | null
          nodes: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edges?: Json | null
          id?: string
          metadata?: Json | null
          nodes?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edges?: Json | null
          id?: string
          metadata?: Json | null
          nodes?: Json | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_tags: {
        Row: {
          tag: string | null
          usage_count: number | null
          completed_count: number | null
        }
        Insert: {
          tag?: string | null
          usage_count?: number | null
          completed_count?: number | null
        }
        Update: {
          tag?: string | null
          usage_count?: number | null
          completed_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_figures: {
        Row: {
          id: string
          session_id: string
          stage: number
          title: string
          description: string
          figure_type: string
          data_url: string
          file_path: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          stage: number
          title: string
          description?: string
          figure_type: string
          data_url: string
          file_path: string
          metadata: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          stage?: number
          title?: string
          description?: string
          figure_type?: string
          data_url?: string
          file_path?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_figures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "query_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      query_session_analytics: {
        Row: {
          date: string | null
          total_queries: number | null
          completed_queries: number | null
          paused_queries: number | null
          failed_queries: number | null
          avg_completion_time_minutes: number | null
          avg_tokens_used: number | null
        }
        Insert: {
          date?: string | null
          total_queries?: number | null
          completed_queries?: number | null
          paused_queries?: number | null
          failed_queries?: number | null
          avg_completion_time_minutes?: number | null
          avg_tokens_used?: number | null
        }
        Update: {
          date?: string | null
          total_queries?: number | null
          completed_queries?: number | null
          paused_queries?: number | null
          failed_queries?: number | null
          avg_completion_time_minutes?: number | null
          avg_tokens_used?: number | null
        }
        Relationships: []
      }
      query_sessions: {
        Row: {
          id: string
          query: string
          status: string
          current_stage: number
          total_stages: number
          created_at: string
          updated_at: string
          completed_at: string | null
          research_context: Json
          graph_data: Json
          stage_results: Json
          metadata: Json
          user_id: string | null
          tags: string[]
        }
        Insert: {
          id?: string
          query: string
          status?: string
          current_stage?: number
          total_stages?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          research_context: Json
          graph_data: Json
          stage_results: Json
          metadata: Json
          user_id?: string | null
          tags: string[]
        }
        Update: {
          id?: string
          query?: string
          status?: string
          current_stage?: number
          total_stages?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          research_context?: Json
          graph_data?: Json
          stage_results?: Json
          metadata?: Json
          user_id?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      query_tables: {
        Row: {
          id: string
          session_id: string
          stage: number
          title: string
          description: string
          data: Json
          schema: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          stage: number
          title: string
          description?: string
          data: Json
          schema: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          stage?: number
          title?: string
          description?: string
          data?: Json
          schema?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_tables_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "query_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      research_sessions: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stage_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          parameters: Json | null
          results: Json | null
          session_id: string
          stage_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          parameters?: Json | null
          results?: Json | null
          session_id: string
          stage_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          parameters?: Json | null
          results?: Json | null
          session_id?: string
          stage_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_executions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      completion_rates_by_field: {
        Row: {
          field: string | null
          total_sessions: number | null
          completed_sessions: number | null
          completion_rate_percent: number | null
        }
        Relationships: []
      }
      popular_tags: {
        Row: {
          tag: string | null
          usage_count: number | null
          completed_count: number | null
        }
        Relationships: []
      }
      query_session_analytics: {
        Row: {
          date: string | null
          total_queries: number | null
          completed_queries: number | null
          paused_queries: number | null
          failed_queries: number | null
          avg_completion_time_minutes: number | null
          avg_tokens_used: number | null
        }
        Relationships: []
      }
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
    Enums: {},
  },
} as const
