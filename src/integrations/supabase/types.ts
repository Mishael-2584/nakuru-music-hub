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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          event_id: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          content: string | null
          created_at: string
          current_attendees: number | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          max_attendees: number | null
          registration_required: boolean | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          current_attendees?: number | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_bodies: {
        Row: {
          abbreviation: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          abbreviation: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          abbreviation?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      fees: {
        Row: {
          course_name: string
          course_type: string
          created_at: string
          description: string | null
          duration: string | null
          exam_fee: number | null
          id: string
          is_active: boolean | null
          level: string | null
          material_fee: number | null
          payment_frequency: string | null
          price: number
          registration_fee: number | null
          updated_at: string
        }
        Insert: {
          course_name: string
          course_type: string
          created_at?: string
          description?: string | null
          duration?: string | null
          exam_fee?: number | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          material_fee?: number | null
          payment_frequency?: string | null
          price: number
          registration_fee?: number | null
          updated_at?: string
        }
        Update: {
          course_name?: string
          course_type?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          exam_fee?: number | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          material_fee?: number | null
          payment_frequency?: string | null
          price?: number
          registration_fee?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          age: number
          course_category: string | null
          created_at: string
          email: string
          experience: string
          goals: string | null
          id: string
          instrument: string
          learning_mode: string | null
          location: string | null
          owns_instrument: boolean | null
          parent_name: string | null
          parent_phone: string | null
          phone: string
          preferred_schedule: string | null
          proficiency_level: string | null
          status: string | null
          student_name: string
          time_slot_id: string | null
          updated_at: string
        }
        Insert: {
          age: number
          course_category?: string | null
          created_at?: string
          email: string
          experience: string
          goals?: string | null
          id?: string
          instrument: string
          learning_mode?: string | null
          location?: string | null
          owns_instrument?: boolean | null
          parent_name?: string | null
          parent_phone?: string | null
          phone: string
          preferred_schedule?: string | null
          proficiency_level?: string | null
          status?: string | null
          student_name: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          course_category?: string | null
          created_at?: string
          email?: string
          experience?: string
          goals?: string | null
          id?: string
          instrument?: string
          learning_mode?: string | null
          location?: string | null
          owns_instrument?: boolean | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string
          preferred_schedule?: string | null
          proficiency_level?: string | null
          status?: string | null
          student_name?: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price_range: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price_range?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_range?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string
          current_bookings: number | null
          day_of_week: number
          end_time: string
          id: string
          instructor_name: string | null
          is_available: boolean | null
          max_capacity: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_bookings?: number | null
          day_of_week: number
          end_time: string
          id?: string
          instructor_name?: string | null
          is_available?: boolean | null
          max_capacity?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_bookings?: number | null
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_name?: string | null
          is_available?: boolean | null
          max_capacity?: number | null
          start_time?: string
          updated_at?: string
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
    Enums: {},
  },
} as const
