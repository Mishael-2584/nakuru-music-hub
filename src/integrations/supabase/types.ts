export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          phone: string | null;
          service_category: string;
          project_type: string | null;
          event_date: string | null;
          location: string | null;
          budget_range: string | null;
          timeline: string | null;
          specific_requirements: string | null;
          reference_materials_url: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          admin_notes: string | null;
          quote_amount: number | null;
          quote_sent_at: string | null;
          preferred_contact_method: string;
          additional_notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          email: string;
          phone?: string | null;
          service_category: string;
          project_type?: string | null;
          event_date?: string | null;
          location?: string | null;
          budget_range?: string | null;
          timeline?: string | null;
          specific_requirements?: string | null;
          reference_materials_url?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          admin_notes?: string | null;
          quote_amount?: number | null;
          quote_sent_at?: string | null;
          preferred_contact_method?: string;
          additional_notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          service_category?: string;
          project_type?: string | null;
          event_date?: string | null;
          location?: string | null;
          budget_range?: string | null;
          timeline?: string | null;
          specific_requirements?: string | null;
          reference_materials_url?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          admin_notes?: string | null;
          quote_amount?: number | null;
          quote_sent_at?: string | null;
          preferred_contact_method?: string;
          additional_notes?: string | null;
        };
      };
      registrations: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          phone: string;
          age: number;
          instrument: string;
          experience_level: string;
          goals: string;
          preferred_schedule: string;
          additional_notes: string | null;
          status: string;
          receipt_number: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          phone: string;
          age: number;
          instrument: string;
          experience_level: string;
          goals: string;
          preferred_schedule: string;
          additional_notes?: string | null;
          status?: string;
          receipt_number?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          phone?: string;
          age?: number;
          instrument?: string;
          experience_level?: string;
          goals?: string;
          preferred_schedule?: string;
          additional_notes?: string | null;
          status?: string;
          receipt_number?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          role: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          role?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          role?: string;
        };
      };
      events: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string;
          date: string;
          time: string;
          location: string;
          image_url: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description: string;
          date: string;
          time: string;
          location: string;
          image_url?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          date?: string;
          time?: string;
          location?: string;
          image_url?: string | null;
          status?: string;
        };
      };
      news: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: string;
          image_url: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content: string;
          image_url?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: string;
          image_url?: string | null;
          status?: string;
        };
      };
      fees: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          course_type: string;
          course_name: string;
          price: number;
          duration: string;
          description: string;
          is_active: boolean;
          mode?: string;
          sessions_per_week?: number;
          hours_per_session?: number;
          currency?: string;
          payment_type?: string;
          level?: string;
          payment_frequency?: string;
          registration_fee?: number;
          material_fee?: number;
          exam_fee?: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          course_type: string;
          course_name: string;
          price: number;
          duration: string;
          description: string;
          is_active?: boolean;
          mode?: string;
          sessions_per_week?: number;
          hours_per_session?: number;
          currency?: string;
          payment_type?: string;
          level?: string;
          payment_frequency?: string;
          registration_fee?: number;
          material_fee?: number;
          exam_fee?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          course_type?: string;
          course_name?: string;
          price?: number;
          duration?: string;
          description?: string;
          is_active?: boolean;
          mode?: string;
          sessions_per_week?: number;
          hours_per_session?: number;
          currency?: string;
          payment_type?: string;
          level?: string;
          payment_frequency?: string;
          registration_fee?: number;
          material_fee?: number;
          exam_fee?: number;
        };
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string;
          image_url: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description: string;
          image_url?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          image_url?: string | null;
          status?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          message: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          message: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          message?: string;
          status?: string;
        };
      };
      pending_teachers: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          phone: string;
          password: string;
          bio: string | null;
          experience: string | null;
          category: string;
          subjects: string[];
          status: string;
          cv_file_path: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          phone: string;
          password: string;
          bio?: string | null;
          experience?: string | null;
          category: string;
          subjects: string[];
          status?: string;
          cv_file_path?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          phone?: string;
          password?: string;
          bio?: string | null;
          experience?: string | null;
          category?: string;
          subjects?: string[];
          status?: string;
          cv_file_path?: string | null;
        };
      };
      teachers: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          phone: string;
          password: string;
          bio: string | null;
          experience: string | null;
          category: string;
          subjects: string[];
          status: string;
          user_id: string | null;
          cv_file_path: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          phone: string;
          password: string;
          bio?: string | null;
          experience?: string | null;
          category: string;
          subjects: string[];
          status?: string;
          user_id?: string | null;
          cv_file_path?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          phone?: string;
          password?: string;
          bio?: string | null;
          experience?: string | null;
          category?: string;
          subjects?: string[];
          status?: string;
          user_id?: string | null;
          cv_file_path?: string | null;
        };
      };
    };
  };
}

// Invoice type
export type Invoice = {
  id: string;
  student_id: string;
  fee_id?: string | null;
  amount: number;
  period_start: string; // ISO date
  period_end: string;   // ISO date
  due_date: string;     // ISO date
  status: 'pending' | 'paid' | 'overdue' | 'void' | 'cancelled';
  is_auto_generated?: boolean;
  admin_override?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

// Payment type
export type Payment = {
  id: string;
  invoice_id: string;
  mpesa_transaction_id: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at: string | null;
  payer_phone: string | null;
  raw_callback_data: any | null;
  created_at: string;
  updated_at: string;
};
