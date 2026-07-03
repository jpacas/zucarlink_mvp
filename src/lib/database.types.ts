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
      companies: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          body: string
          category: string
          country: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          published_at: string
          slug: string
          source_name: string | null
          source_url: string | null
          status: string
          summary: string
          tags: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at: string
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          summary: string
          tags?: string[]
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at?: string
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          summary?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one_cleared_at: string | null
          participant_one_id: string
          participant_two_cleared_at: string | null
          participant_two_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_cleared_at?: string | null
          participant_one_id: string
          participant_two_cleared_at?: string | null
          participant_two_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_cleared_at?: string | null
          participant_one_id?: string
          participant_two_cleared_at?: string | null
          participant_two_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          end_date: string | null
          id: string
          organizer: string | null
          slug: string
          source_url: string | null
          start_date: string
          status: string
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          organizer?: string | null
          slug: string
          source_url?: string | null
          start_date: string
          status?: string
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          organizer?: string | null
          slug?: string
          source_url?: string | null
          start_date?: string
          status?: string
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          achievements: string | null
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          profile_id: string
          role_title: string
          start_date: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          profile_id: string
          role_title: string
          start_date: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          profile_id?: string
          role_title?: string
          start_date?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          author_id: string
          body: string
          created_at: string
          id: string
          parent_reply_id: string | null
          status: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          status?: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          status?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topic_likes: {
        Row: {
          created_at: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_likes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          author_id: string
          body: string
          category_id: string
          created_at: string
          id: string
          last_activity_at: string | null
          reply_count: number
          slug: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          author_id: string
          body: string
          category_id: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          reply_count?: number
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          author_id?: string
          body?: string
          category_id?: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          reply_count?: number
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_items: {
        Row: {
          created_at: string
          featured: boolean
          id: string
          label: string
          market_summary: string | null
          market_summary_sources: Json | null
          market_summary_updated_at: string | null
          notes: string | null
          observed_at: string
          source_name: string | null
          source_url: string | null
          status: string
          unit: string | null
          updated_at: string
          value: string
          value_numeric: number | null
        }
        Insert: {
          created_at?: string
          featured?: boolean
          id?: string
          label: string
          market_summary?: string | null
          market_summary_sources?: Json | null
          market_summary_updated_at?: string | null
          notes?: string | null
          observed_at: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value: string
          value_numeric?: number | null
        }
        Update: {
          created_at?: string
          featured?: boolean
          id?: string
          label?: string
          market_summary?: string | null
          market_summary_sources?: Json | null
          market_summary_updated_at?: string | null
          notes?: string | null
          observed_at?: string
          source_name?: string | null
          source_url?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value?: string
          value_numeric?: number | null
        }
        Relationships: []
      }
      profile_specialties: {
        Row: {
          created_at: string
          profile_id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_specialties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_path: string | null
          country: string | null
          created_at: string
          current_company_id: string | null
          full_name: string
          id: string
          last_seen_at: string | null
          linkedin_url: string | null
          phone: string | null
          profile_status: string
          role_title: string | null
          short_bio: string | null
          updated_at: string
          verification_status: string
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          account_type: string
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          current_company_id?: string | null
          full_name: string
          id: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          phone?: string | null
          profile_status?: string
          role_title?: string | null
          short_bio?: string | null
          updated_at?: string
          verification_status?: string
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          account_type?: string
          avatar_path?: string | null
          country?: string | null
          created_at?: string
          current_company_id?: string | null
          full_name?: string
          id?: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          phone?: string | null
          profile_status?: string
          role_title?: string | null
          short_bio?: string | null
          updated_at?: string
          verification_status?: string
          whatsapp?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_company_id_fkey"
            columns: ["current_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      provider_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          provider_id: string
          requester_id: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          provider_id: string
          requester_id?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          provider_id?: string
          requester_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_leads_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          brands: string[]
          category_id: string | null
          company_name: string
          contact_email: string | null
          countries: string[]
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          logo_path: string | null
          logo_url: string | null
          long_description: string | null
          owner_id: string
          products_services: string[]
          short_description: string | null
          slug: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          brands?: string[]
          category_id?: string | null
          company_name: string
          contact_email?: string | null
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_path?: string | null
          logo_url?: string | null
          long_description?: string | null
          owner_id: string
          products_services?: string[]
          short_description?: string | null
          slug: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          brands?: string[]
          category_id?: string | null
          company_name?: string
          contact_email?: string | null
          countries?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_path?: string | null
          logo_url?: string | null
          long_description?: string | null
          owner_id?: string
          products_services?: string[]
          short_description?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "provider_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          email_forum_reply: boolean
          email_inactivity_digest: boolean
          email_liked_topic_reply: boolean
          email_unread_reminder: boolean
          unsubscribe_token: string
          unsubscribed_all: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_forum_reply?: boolean
          email_inactivity_digest?: boolean
          email_liked_topic_reply?: boolean
          email_unread_reminder?: boolean
          unsubscribe_token?: string
          unsubscribed_all?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_forum_reply?: boolean
          email_inactivity_digest?: boolean
          email_liked_topic_reply?: boolean
          email_unread_reminder?: boolean
          unsubscribe_token?: string
          unsubscribed_all?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_provider_status: {
        Args: { next_status: string; provider_id: string }
        Returns: string
      }
      build_unique_forum_slug: {
        Args: { base_text: string; topic_id?: string }
        Returns: string
      }
      clear_thread: { Args: { p_thread_id: string }; Returns: undefined }
      count_my_unread: { Args: never; Returns: number }
      create_forum_reply: {
        Args: {
          attachment_path?: string
          attachment_type?: string
          body_text: string
          parent_reply_id?: string
          thread_slug: string
        }
        Returns: {
          id: string
        }[]
      }
      create_forum_topic: {
        Args: {
          attachment_path?: string
          attachment_type?: string
          body_text: string
          category_slug: string
          title_text: string
        }
        Returns: {
          slug: string
        }[]
      }
      create_provider_lead: {
        Args: {
          company_text?: string
          email_text: string
          message_text?: string
          name_text: string
          provider_id: string
        }
        Returns: string
      }
      delete_forum_reply: { Args: { reply_id: string }; Returns: undefined }
      delete_forum_topic: { Args: { thread_slug: string }; Returns: undefined }
      get_admin_operational_dashboard: {
        Args: { period_days?: number }
        Returns: Json
      }
      get_directory_profile_detail: {
        Args: { profile_id: string }
        Returns: {
          avatar_path: string
          country: string
          experiences: Json
          full_name: string
          id: string
          organization_name: string
          role_title: string
          short_bio: string
          specialties: string[]
          verification_status: string
          years_experience: number
        }[]
      }
      get_email_prefs_by_token: {
        Args: { p_token: string }
        Returns: {
          email_forum_reply: boolean
          email_inactivity_digest: boolean
          email_liked_topic_reply: boolean
          email_unread_reminder: boolean
          unsubscribed_all: boolean
        }[]
      }
      get_forum_thread: {
        Args: { thread_slug: string }
        Returns: {
          attachment_path: string
          attachment_type: string
          author: Json
          body: string
          category: Json
          created_at: string
          excerpt: string
          id: string
          last_activity_at: string
          replies: Json
          reply_count: number
          slug: string
          title: string
        }[]
      }
      get_forum_topic_like_state: {
        Args: { thread_slug: string }
        Returns: {
          like_count: number
          viewer_liked: boolean
        }[]
      }
      get_profile_forum_activity: {
        Args: { profile_id: string }
        Returns: {
          recent_contributions: Json
          reply_count: number
          thread_count: number
          top_categories: string[]
        }[]
      }
      get_provider_by_slug: {
        Args: { provider_slug: string }
        Returns: {
          brands: string[]
          category: Json
          company_name: string
          contact_email: string
          countries: string[]
          id: string
          is_verified: boolean
          logo_url: string
          long_description: string
          products_services: string[]
          short_description: string
          slug: string
          status: string
          website: string
        }[]
      }
      get_public_directory_summary: {
        Args: never
        Returns: {
          total_companies: number
          total_countries: number
          total_members: number
          total_specialties: number
        }[]
      }
      get_public_member_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_path: string
          country: string
          full_name: string
          id: string
          organization_name: string
          role_title: string
          short_bio: string
          verification_status: string
        }[]
      }
      get_thread_messages: {
        Args: { p_thread_id: string }
        Returns: {
          attachment_path: string
          attachment_type: string
          body: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      list_forum_categories: {
        Args: never
        Returns: {
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
        }[]
      }
      list_forum_threads: {
        Args: { category_slug?: string; limit_count?: number }
        Returns: {
          attachment_type: string
          author: Json
          body: string
          category: Json
          created_at: string
          excerpt: string
          id: string
          last_activity_at: string
          like_count: number
          reply_count: number
          slug: string
          title: string
          viewer_liked: boolean
        }[]
      }
      list_my_threads: {
        Args: never
        Returns: {
          last_message_at: string
          last_message_attachment_type: string
          last_message_body: string
          other_avatar_path: string
          other_full_name: string
          other_profile_id: string
          other_verification_status: string
          thread_id: string
          unread_count: number
        }[]
      }
      list_provider_categories: {
        Args: never
        Returns: {
          id: string
          name: string
          slug: string
        }[]
      }
      list_provider_leads: {
        Args: never
        Returns: {
          company: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          provider_id: string
          status: string
        }[]
      }
      list_providers_admin: {
        Args: never
        Returns: {
          category: Json
          company_name: string
          countries: string[]
          id: string
          is_verified: boolean
          logo_url: string
          short_description: string
          slug: string
          status: string
        }[]
      }
      list_public_preview_profiles: {
        Args: { limit_count?: number }
        Returns: {
          avatar_path: string
          country: string
          full_name: string
          id: string
          is_verified: boolean
          organization_name: string
          role_title: string
          specialties: string[]
        }[]
      }
      mark_thread_read: { Args: { p_thread_id: string }; Returns: undefined }
      normalize_company_name: { Args: { p_name: string }; Returns: string }
      refresh_forum_topic_metrics: {
        Args: { target_topic_id: string }
        Returns: undefined
      }
      replace_profile_specialties: {
        Args: { p_specialty_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      search_directory_profiles: {
        Args: {
          country_filter?: string
          limit_count?: number
          offset_count?: number
          search_text?: string
          specialty_slug_filter?: string
        }
        Returns: {
          avatar_path: string
          country: string
          full_name: string
          id: string
          organization_name: string
          role_title: string
          short_bio: string
          specialties: string[]
          verification_status: string
        }[]
      }
      search_providers: {
        Args: {
          category_slug?: string
          country_filter?: string
          limit_count?: number
          offset_count?: number
          search_text?: string
        }
        Returns: {
          brands: string[]
          category: Json
          company_name: string
          countries: string[]
          id: string
          is_verified: boolean
          logo_url: string
          short_description: string
          slug: string
        }[]
      }
      send_message: {
        Args: {
          attachment_path?: string
          attachment_type?: string
          body_text: string
          p_thread_id: string
        }
        Returns: string
      }
      slugify: { Args: { input: string }; Returns: string }
      start_or_get_thread: {
        Args: { other_profile_id: string }
        Returns: string
      }
      toggle_forum_topic_like: {
        Args: { thread_slug: string }
        Returns: {
          like_count: number
          viewer_liked: boolean
        }[]
      }
      touch_last_seen: { Args: never; Returns: undefined }
      update_email_prefs_by_token: {
        Args: { p_prefs: Json; p_token: string }
        Returns: boolean
      }
      update_provider_lead_status: {
        Args: { lead_id: string; next_status: string }
        Returns: undefined
      }
      upsert_company: {
        Args: { p_country?: string; p_name: string }
        Returns: string
      }
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
