export interface Database {
  public: {
    Tables: {
      // Classroom System Tables
      classrooms: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          teacher_id: string;
          name: string;
          description: string | null;
          status: 'pending' | 'approved' | 'rejected';
          class_code: string | null;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          teacher_id: string;
          name: string;
          description?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          class_code?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          teacher_id?: string;
          name?: string;
          description?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          class_code?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
        };
      };
      classroom_enrollments: {
        Row: {
          id: string;
          created_at: string;
          classroom_id: string;
          student_id: string;
          status: 'invited' | 'enrolled' | 'left';
          invited_at: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          classroom_id: string;
          student_id: string;
          status?: 'invited' | 'enrolled' | 'left';
          invited_at?: string | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          classroom_id?: string;
          student_id?: string;
          status?: 'invited' | 'enrolled' | 'left';
          invited_at?: string | null;
          joined_at?: string | null;
        };
      };
      classroom_posts: {
        Row: {
          id: string;
          created_at: string;
          classroom_id: string;
          author_teacher_id: string | null;
          content: string;
          is_assignment: boolean | null;
          assignment_title: string | null;
          due_date: string | null;
          max_points: number | null;
          is_pinned: boolean;
          pinned_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          classroom_id: string;
          author_teacher_id?: string | null;
          content: string;
          is_assignment?: boolean | null;
          assignment_title?: string | null;
          due_date?: string | null;
          max_points?: number | null;
          is_pinned?: boolean;
          pinned_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          classroom_id?: string;
          author_teacher_id?: string | null;
          content?: string;
          is_assignment?: boolean | null;
          assignment_title?: string | null;
          due_date?: string | null;
          max_points?: number | null;
          is_pinned?: boolean;
          pinned_at?: string | null;
        };
      };
      classroom_comments: {
        Row: {
          id: string;
          created_at: string;
          post_id: string;
          author_student_id: string | null;
          author_teacher_id: string | null;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          post_id: string;
          author_student_id?: string | null;
          author_teacher_id?: string | null;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          post_id?: string;
          author_student_id?: string | null;
          author_teacher_id?: string | null;
          content?: string;
        };
      };
      classroom_post_attachments: {
        Row: {
          id: string;
          created_at: string;
          post_id: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          file_type: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          post_id: string;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          file_type?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          post_id?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          file_type?: string | null;
        };
      };
      assignment_submissions: {
        Row: {
          id: string;
          created_at: string;
          post_id: string;
          student_id: string;
          submission_text: string | null;
          submitted_at: string | null;
          grade_points: number | null;
          grade_feedback: string | null;
          graded_by: string | null;
          graded_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          post_id: string;
          student_id: string;
          submission_text?: string | null;
          submitted_at?: string | null;
          grade_points?: number | null;
          grade_feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          post_id?: string;
          student_id?: string;
          submission_text?: string | null;
          submitted_at?: string | null;
          grade_points?: number | null;
          grade_feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
        };
      };
      // Core Tables
      students: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
          student_name: string;
          email: string;
          phone: string;
          date_of_birth: string | null;
          learning_mode: string | null;
          profile_photo_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          student_name: string;
          email: string;
          phone: string;
          date_of_birth?: string | null;
          learning_mode?: string | null;
          profile_photo_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
          student_name?: string;
          email?: string;
          phone?: string;
          date_of_birth?: string | null;
          learning_mode?: string | null;
          profile_photo_url?: string | null;
        };
      };
      teachers: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string | null;
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
          updated_at?: string;
          user_id?: string | null;
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
          updated_at?: string;
          user_id?: string | null;
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
      portal_messages: {
        Row: {
          id: string;
          created_at: string;
          sender_id: string;
          recipient_id: string;
          subject: string;
          message: string;
          is_read: boolean;
          message_type: string;
          meeting_id?: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          sender_id: string;
          recipient_id: string;
          subject: string;
          message: string;
          is_read?: boolean;
          message_type?: string;
          meeting_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          sender_id?: string;
          recipient_id?: string;
          subject?: string;
          message?: string;
          is_read?: boolean;
          message_type?: string;
          meeting_id?: string | null;
        };
      };
      instant_meetings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string | null;
          meeting_url: string;
          host_id: string;
          host_name: string;
          host_role: string;
          participants: string[];
          max_participants: number;
          duration: number;
          status: string;
          meeting_code: string;
          is_public: boolean;
          allow_recording: boolean;
          started_at: string | null;
          ended_at: string | null;
          actual_duration: number | null;
          participant_join_log: any;
          scheduled_start_time: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string | null;
          meeting_url: string;
          host_id: string;
          host_name: string;
          host_role: string;
          participants?: string[];
          max_participants?: number;
          duration?: number;
          status?: string;
          meeting_code: string;
          is_public?: boolean;
          allow_recording?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          actual_duration?: number | null;
          participant_join_log?: any;
          scheduled_start_time?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string | null;
          meeting_url?: string;
          host_id?: string;
          host_name?: string;
          host_role?: string;
          participants?: string[];
          max_participants?: number;
          duration?: number;
          status?: string;
          meeting_code?: string;
          is_public?: boolean;
          allow_recording?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          actual_duration?: number | null;
          participant_join_log?: any;
          scheduled_start_time?: string | null;
        };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Classroom RPC Functions
      create_classroom_post: {
        Args: {
          classroom_id_param: string;
          author_teacher_id_param: string;
          content_param: string;
        };
        Returns: { id: string }[];
      };
      get_classroom_feed: {
        Args: {
          classroom_id_param: string;
        };
        Returns: {
          post_id: string;
          content: string;
          created_at: string;
          author_name: string;
          author_teacher_id: string;
          is_assignment: boolean;
          assignment_title: string | null;
          due_date: string | null;
          max_points: number | null;
        }[];
      };
      get_post_comments: {
        Args: {
          post_id_param: string;
        };
        Returns: {
          id: string;
          content: string;
          created_at: string;
          author_name: string;
          author_role: string;
        }[];
      };
      add_classroom_comment: {
        Args: {
          post_id_param: string;
          author_student_id_param: string | null;
          author_teacher_id_param: string | null;
          content_param: string;
        };
        Returns: { id: string }[];
      };
      update_classroom_post: {
        Args: {
          post_id_param: string;
          new_content_param: string;
        };
        Returns: undefined;
      };
      delete_classroom_post: {
        Args: {
          post_id_param: string;
        };
        Returns: undefined;
      };
      create_classroom: {
        Args: {
          teacher_id_param: string;
          name_param: string;
          description_param: string;
        };
        Returns: { id: string; status: string }[];
      };
      approve_classroom: {
        Args: {
          classroom_id_param: string;
          approved_by_param: string;
        };
        Returns: { id: string; class_code: string; status: string }[];
      };
      enroll_student_with_code: {
        Args: {
          student_id_param: string;
          class_code_param: string;
        };
        Returns: { classroom_id: string; status: string }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };

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

// Enhanced portal messages type with meeting support
export type PortalMessage = {
  id: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  message_type: 'general' | 'lesson' | 'assignment' | 'payment' | 'emergency' | 'meeting_invitation';
  meeting_id?: string | null;
};

// Instant meeting type
export type InstantMeeting = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string | null;
  meeting_url: string;
  host_id: string;
  host_name: string;
  host_role: 'teacher' | 'admin';
  participants: string[];
  max_participants: number;
  duration: number;
  status: 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled';
  meeting_code: string;
  is_public: boolean;
  allow_recording: boolean;
  started_at?: string | null;
  ended_at?: string | null;
  actual_duration?: number | null;
  participant_join_log: any;
  scheduled_start_time?: string | null;
};
