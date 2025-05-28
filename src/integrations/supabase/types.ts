export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sources: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sources?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sources?: number | null
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string | null
          id: string
          name: string
          subject_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          subject_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          chapter_id: string
          created_at: string | null
          id: string
          item_number: number
          item_type: Database["public"]["Enums"]["content_item_type"]
          name: string
          revision_count: number | null
          status: Database["public"]["Enums"]["content_item_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          id?: string
          item_number: number
          item_type: Database["public"]["Enums"]["content_item_type"]
          name: string
          revision_count?: number | null
          status?: Database["public"]["Enums"]["content_item_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          id?: string
          item_number?: number
          item_type?: Database["public"]["Enums"]["content_item_type"]
          name?: string
          revision_count?: number | null
          status?: Database["public"]["Enums"]["content_item_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          batch_id: string
          chapter_id: string
          content_item_id: string | null
          created_at: string
          id: string
          scheduled_date: string
          status: string
          subject_id: string
          task_name: string
          task_number: number
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id: string
          chapter_id: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          status?: string
          subject_id: string
          task_name: string
          task_number: number
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          chapter_id?: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          status?: string
          subject_id?: string
          task_name?: string
          task_number?: number
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          category: Database["public"]["Enums"]["target_category_enum"]
          chapter_id: string
          created_at: string | null
          deadline: string | null
          end_time: string | null
          id: string
          name: string
          progress: number
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["target_category_enum"]
          chapter_id: string
          created_at?: string | null
          deadline?: string | null
          end_time?: string | null
          id?: string
          name: string
          progress?: number
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["target_category_enum"]
          chapter_id?: string
          created_at?: string | null
          deadline?: string | null
          end_time?: string | null
          id?: string
          name?: string
          progress?: number
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "targets_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_item_status: "completed" | "incomplete" | "revision"
      content_item_type: "lectures" | "notes" | "dpps" | "homework"
      target_category_enum:
        | "preprimary"
        | "primary"
        | "secondary"
        | "higher_secondary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_item_status: ["completed", "incomplete", "revision"],
      content_item_type: ["lectures", "notes", "dpps", "homework"],
      target_category_enum: [
        "preprimary",
        "primary",
        "secondary",
        "higher_secondary",
      ],
    },
  },
} as const
