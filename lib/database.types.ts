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
      accounts: {
        Row: {
          auto_reply_mode: Database["public"]["Enums"]["auto_reply_mode_t"]
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_synced_at: string | null
          platform: Database["public"]["Enums"]["platform_t"]
          raw: Json | null
          repliz_account_id: string
          repliz_credential_id: string | null
          repliz_user_id: string | null
          status: Database["public"]["Enums"]["account_status_t"]
          updated_at: string
          username: string | null
          workspace_id: string
        }
        Insert: {
          auto_reply_mode?: Database["public"]["Enums"]["auto_reply_mode_t"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["platform_t"]
          raw?: Json | null
          repliz_account_id: string
          repliz_credential_id?: string | null
          repliz_user_id?: string | null
          status?: Database["public"]["Enums"]["account_status_t"]
          updated_at?: string
          username?: string | null
          workspace_id: string
        }
        Update: {
          auto_reply_mode?: Database["public"]["Enums"]["auto_reply_mode_t"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["platform_t"]
          raw?: Json | null
          repliz_account_id?: string
          repliz_credential_id?: string | null
          repliz_user_id?: string | null
          status?: Database["public"]["Enums"]["account_status_t"]
          updated_at?: string
          username?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_repliz_credential_id_fkey"
            columns: ["repliz_credential_id"]
            isOneToOne: false
            referencedRelation: "repliz_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          account_id: string | null
          attempts: number
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          job_type: Database["public"]["Enums"]["job_type_t"]
          max_attempts: number
          payload: Json | null
          provider: Database["public"]["Enums"]["ai_provider_t"] | null
          result: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status_t"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          attempts?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: Database["public"]["Enums"]["job_type_t"]
          max_attempts?: number
          payload?: Json | null
          provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status_t"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          attempts?: number
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: Database["public"]["Enums"]["job_type_t"]
          max_attempts?: number
          payload?: Json | null
          provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status_t"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          account_id: string
          ai_provider: Database["public"]["Enums"]["ai_provider_t"] | null
          ai_reply: string | null
          comment_media_urls: string[]
          comment_text: string | null
          commenter_external_id: string | null
          commenter_username: string | null
          content_id: string | null
          created_at: string
          id: string
          platform_comment_id: string | null
          raw: Json | null
          received_at: string
          replied_at: string | null
          repliz_comment_record_id: string | null
          repliz_content_id: string | null
          reply_status: Database["public"]["Enums"]["comment_reply_status_t"]
          schedule_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          ai_reply?: string | null
          comment_media_urls?: string[]
          comment_text?: string | null
          commenter_external_id?: string | null
          commenter_username?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          platform_comment_id?: string | null
          raw?: Json | null
          received_at?: string
          replied_at?: string | null
          repliz_comment_record_id?: string | null
          repliz_content_id?: string | null
          reply_status?: Database["public"]["Enums"]["comment_reply_status_t"]
          schedule_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          ai_reply?: string | null
          comment_media_urls?: string[]
          comment_text?: string | null
          commenter_external_id?: string | null
          commenter_username?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          platform_comment_id?: string | null
          raw?: Json | null
          received_at?: string
          replied_at?: string | null
          repliz_comment_record_id?: string | null
          repliz_content_id?: string | null
          reply_status?: Database["public"]["Enums"]["comment_reply_status_t"]
          schedule_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          account_id: string
          ai_provider: Database["public"]["Enums"]["ai_provider_t"] | null
          angle: string | null
          created_at: string
          cta: string | null
          emotion_type: string | null
          generated_by_job_id: string | null
          hook: string | null
          id: string
          niche: string | null
          persona_id: string | null
          status: Database["public"]["Enums"]["idea_status_t"]
          title: string
          topic: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          angle?: string | null
          created_at?: string
          cta?: string | null
          emotion_type?: string | null
          generated_by_job_id?: string | null
          hook?: string | null
          id?: string
          niche?: string | null
          persona_id?: string | null
          status?: Database["public"]["Enums"]["idea_status_t"]
          title: string
          topic?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          angle?: string | null
          created_at?: string
          cta?: string | null
          emotion_type?: string | null
          generated_by_job_id?: string | null
          hook?: string | null
          id?: string
          niche?: string | null
          persona_id?: string | null
          status?: Database["public"]["Enums"]["idea_status_t"]
          title?: string
          topic?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_job_fk"
            columns: ["generated_by_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content_segments: {
        Row: {
          body: string
          content_id: string
          created_at: string
          id: string
          media_urls: string[]
          position: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          content_id: string
          created_at?: string
          id?: string
          media_urls?: string[]
          position: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          content_id?: string
          created_at?: string
          id?: string
          media_urls?: string[]
          position?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_segments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_segments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          account_id: string
          ai_provider: Database["public"]["Enums"]["ai_provider_t"] | null
          body: string
          created_at: string
          id: string
          idea_id: string | null
          persona_id: string | null
          post_type: Database["public"]["Enums"]["post_type_t"]
          status: Database["public"]["Enums"]["content_status_t"]
          suggested_comments: string[] | null
          title: string | null
          updated_at: string
          viral_score: number | null
          workspace_id: string
        }
        Insert: {
          account_id: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          body: string
          created_at?: string
          id?: string
          idea_id?: string | null
          persona_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type_t"]
          status?: Database["public"]["Enums"]["content_status_t"]
          suggested_comments?: string[] | null
          title?: string | null
          updated_at?: string
          viral_score?: number | null
          workspace_id: string
        }
        Update: {
          account_id?: string
          ai_provider?: Database["public"]["Enums"]["ai_provider_t"] | null
          body?: string
          created_at?: string
          id?: string
          idea_id?: string | null
          persona_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type_t"]
          status?: Database["public"]["Enums"]["content_status_t"]
          suggested_comments?: string[] | null
          title?: string | null
          updated_at?: string
          viral_score?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          account_id: string | null
          context: Json | null
          created_at: string
          endpoint: string | null
          http_status: number | null
          id: string
          message: string | null
          related_job_id: string | null
          severity: string
          source: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          account_id?: string | null
          context?: Json | null
          created_at?: string
          endpoint?: string | null
          http_status?: number | null
          id?: string
          message?: string | null
          related_job_id?: string | null
          severity?: string
          source: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          account_id?: string | null
          context?: Json | null
          created_at?: string
          endpoint?: string | null
          http_status?: number | null
          id?: string
          message?: string | null
          related_job_id?: string | null
          severity?: string
          source?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role_t"]
          token: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role_t"]
          token?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role_t"]
          token?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          embedding_status: Database["public"]["Enums"]["embedding_status_t"]
          error_message: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          persona_id: string
          storage_path: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          embedding_status?: Database["public"]["Enums"]["embedding_status_t"]
          error_message?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          persona_id: string
          storage_path?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          embedding_status?: Database["public"]["Enums"]["embedding_status_t"]
          error_message?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          persona_id?: string
          storage_path?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_bases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          kb_id: string
          token_count: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          kb_id: string
          token_count?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          kb_id?: string
          token_count?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          account_id: string
          audience: string | null
          communication_style: string | null
          created_at: string
          cta: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          niche: string | null
          tone: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          audience?: string | null
          communication_style?: string | null
          created_at?: string
          cta?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          niche?: string | null
          tone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          audience?: string | null
          communication_style?: string | null
          created_at?: string
          cta?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          niche?: string | null
          tone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_ai_provider: Database["public"]["Enums"]["ai_provider_t"]
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_ai_provider?: Database["public"]["Enums"]["ai_provider_t"]
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_ai_provider?: Database["public"]["Enums"]["ai_provider_t"]
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      repliz_credentials: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          password_enc: string
          repliz_user_id: string | null
          updated_at: string
          username_enc: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          password_enc: string
          repliz_user_id?: string | null
          updated_at?: string
          username_enc: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          password_enc?: string
          repliz_user_id?: string | null
          updated_at?: string
          username_enc?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repliz_credentials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          account_id: string
          content_id: string
          created_at: string
          id: string
          last_error: string | null
          posted_at: string | null
          pushed_at: string | null
          repliz_content_id: string | null
          repliz_schedule_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["schedule_status_t"]
          topic: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          content_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          posted_at?: string | null
          pushed_at?: string | null
          repliz_content_id?: string | null
          repliz_schedule_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["schedule_status_t"]
          topic?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          content_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          posted_at?: string | null
          pushed_at?: string | null
          repliz_content_id?: string | null
          repliz_schedule_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["schedule_status_t"]
          topic?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          account_id: string | null
          body: Json
          created_at: string
          event_type: Database["public"]["Enums"]["webhook_event_t"]
          external_id: string | null
          headers: Json | null
          id: string
          processed: boolean
          processing_error: string | null
          provider: string
          received_at: string
          signature_valid: boolean | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          account_id?: string | null
          body: Json
          created_at?: string
          event_type: Database["public"]["Enums"]["webhook_event_t"]
          external_id?: string | null
          headers?: Json | null
          id?: string
          processed?: boolean
          processing_error?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          account_id?: string | null
          body?: Json
          created_at?: string
          event_type?: Database["public"]["Enums"]["webhook_event_t"]
          external_id?: string | null
          headers?: Json | null
          id?: string
          processed?: boolean
          processing_error?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role_t"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role_t"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role_t"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          anthropic_api_key: string | null
          auto_comment_count: number
          created_at: string
          daily_post_hour: number
          default_ai_provider: Database["public"]["Enums"]["ai_provider_t"]
          gemini_api_key: string | null
          gemini_model: string | null
          openai_api_key: string | null
          posts_per_day: number
          repliz_webhook_secret: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          anthropic_api_key?: string | null
          auto_comment_count?: number
          created_at?: string
          daily_post_hour?: number
          default_ai_provider?: Database["public"]["Enums"]["ai_provider_t"]
          gemini_api_key?: string | null
          gemini_model?: string | null
          openai_api_key?: string | null
          posts_per_day?: number
          repliz_webhook_secret?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          anthropic_api_key?: string | null
          auto_comment_count?: number
          created_at?: string
          daily_post_hour?: number
          default_ai_provider?: Database["public"]["Enums"]["ai_provider_t"]
          gemini_api_key?: string | null
          gemini_model?: string | null
          openai_api_key?: string | null
          posts_per_day?: number
          repliz_webhook_secret?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: string }
      create_workspace: { Args: { p_name: string }; Returns: string }
      current_workspace_ids: { Args: never; Returns: string[] }
      dashboard_metrics: { Args: { p_workspace_id: string }; Returns: Json }
      enqueue_due_schedules: { Args: never; Returns: number }
      ensure_default_membership: { Args: never; Returns: string }
      has_workspace_role: {
        Args: {
          min_role: Database["public"]["Enums"]["workspace_role_t"]
          ws: string
        }
        Returns: boolean
      }
      invite_info: { Args: { p_token: string }; Returns: Json }
      is_setup_needed: { Args: never; Returns: boolean }
      list_members: {
        Args: never
        Returns: {
          email: string
          full_name: string
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role_t"]
          user_id: string
        }[]
      }
      match_knowledge_chunks: {
        Args: { p_k?: number; p_persona_id: string; p_query_embedding: string }
        Returns: {
          content: string
          id: string
          kb_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      account_status_t: "active" | "inactive" | "disconnected" | "error"
      ai_provider_t: "gemini" | "openai" | "claude"
      auto_reply_mode_t: "manual" | "semi_auto" | "full_auto"
      comment_reply_status_t:
        | "pending"
        | "approved"
        | "replied"
        | "failed"
        | "skipped"
      content_status_t: "draft" | "scheduled" | "posted" | "failed" | "deleted"
      embedding_status_t: "pending" | "processing" | "completed" | "failed"
      idea_status_t: "draft" | "approved" | "rejected" | "used"
      job_status_t: "queued" | "running" | "succeeded" | "failed" | "dead"
      job_type_t:
        | "idea_research"
        | "content_generation"
        | "comment_reply"
        | "embedding"
        | "schedule_push"
        | "schedule_delete"
        | "account_sync"
      platform_t:
        | "threads"
        | "x"
        | "linkedin"
        | "facebook"
        | "instagram"
        | "tiktok"
        | "youtube"
      post_type_t: "single" | "thread"
      schedule_status_t:
        | "pending"
        | "scheduled"
        | "posted"
        | "failed"
        | "cancelled"
      webhook_event_t: "comment" | "schedule" | "chat" | "unknown"
      workspace_role_t: "admin" | "editor" | "viewer"
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
      account_status_t: ["active", "inactive", "disconnected", "error"],
      ai_provider_t: ["gemini", "openai", "claude"],
      auto_reply_mode_t: ["manual", "semi_auto", "full_auto"],
      comment_reply_status_t: [
        "pending",
        "approved",
        "replied",
        "failed",
        "skipped",
      ],
      content_status_t: ["draft", "scheduled", "posted", "failed", "deleted"],
      embedding_status_t: ["pending", "processing", "completed", "failed"],
      idea_status_t: ["draft", "approved", "rejected", "used"],
      job_status_t: ["queued", "running", "succeeded", "failed", "dead"],
      job_type_t: [
        "idea_research",
        "content_generation",
        "comment_reply",
        "embedding",
        "schedule_push",
        "schedule_delete",
        "account_sync",
      ],
      platform_t: [
        "threads",
        "x",
        "linkedin",
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
      ],
      post_type_t: ["single", "thread"],
      schedule_status_t: [
        "pending",
        "scheduled",
        "posted",
        "failed",
        "cancelled",
      ],
      webhook_event_t: ["comment", "schedule", "chat", "unknown"],
      workspace_role_t: ["admin", "editor", "viewer"],
    },
  },
} as const
