// Generated from migrated PostgreSQL by scripts/test-supabase-db.mjs --write-types.
// Do not edit by hand. These types describe storage, not permission to write.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          published: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          published?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          published?: boolean;
        };
        Relationships: [
        ];
      };
      activities: {
        Row: {
          id: string;
          lesson_id: string;
          slug: string;
          version: number;
          engine_kind: string;
          config: Json;
          position: number;
          published: boolean;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          slug: string;
          version?: number;
          engine_kind: string;
          config?: Json;
          position?: number;
          published?: boolean;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          slug?: string;
          version?: number;
          engine_kind?: string;
          config?: Json;
          position?: number;
          published?: boolean;
        };
        Relationships: [
          { foreignKeyName: "activities_lesson_id_fkey"; columns: ["lesson_id"]; isOneToOne: false; referencedRelation: "lessons"; referencedColumns: ["id"] },
        ];
      };
      activity_attempts: {
        Row: {
          id: string;
          child_id: string;
          session_id: string;
          activity_id: string;
          question_id: string | null;
          mutation_id: string;
          response: Json;
          correct: boolean;
          help_level: number;
          attempt_number: number;
          response_time_ms: number | null;
          evidence: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          session_id: string;
          activity_id: string;
          question_id?: string | null;
          mutation_id: string;
          response: Json;
          correct: boolean;
          help_level?: number;
          attempt_number: number;
          response_time_ms?: number | null;
          evidence?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          session_id?: string;
          activity_id?: string;
          question_id?: string | null;
          mutation_id?: string;
          response?: Json;
          correct?: boolean;
          help_level?: number;
          attempt_number?: number;
          response_time_ms?: number | null;
          evidence?: Json;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "activity_attempts_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "activities"; referencedColumns: ["id"] },
          { foreignKeyName: "activity_attempts_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "activity_attempts_question_id_activity_id_fkey"; columns: ["question_id","activity_id"]; isOneToOne: false; referencedRelation: "questions"; referencedColumns: ["id","activity_id"] },
          { foreignKeyName: "activity_attempts_session_id_child_id_fkey"; columns: ["session_id","child_id"]; isOneToOne: false; referencedRelation: "learning_sessions"; referencedColumns: ["id","child_id"] },
        ];
      };
      child_achievements: {
        Row: {
          id: string;
          child_id: string;
          achievement_id: string;
          earned_at: string;
          source_session_id: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          achievement_id: string;
          earned_at?: string;
          source_session_id?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          achievement_id?: string;
          earned_at?: string;
          source_session_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: "child_achievements_achievement_id_fkey"; columns: ["achievement_id"]; isOneToOne: false; referencedRelation: "achievements"; referencedColumns: ["id"] },
          { foreignKeyName: "child_achievements_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "child_achievements_source_session_id_child_id_fkey"; columns: ["source_session_id","child_id"]; isOneToOne: false; referencedRelation: "learning_sessions"; referencedColumns: ["id","child_id"] },
        ];
      };
      child_profiles: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          grade: string;
          avatar: string;
          interests: string[];
          daily_goal: number;
          controls: Json;
          preferences: Json;
          legacy_id: string | null;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          grade: string;
          avatar: string;
          interests?: string[];
          daily_goal?: number;
          controls?: Json;
          preferences?: Json;
          legacy_id?: string | null;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          grade?: string;
          avatar?: string;
          interests?: string[];
          daily_goal?: number;
          controls?: Json;
          preferences?: Json;
          legacy_id?: string | null;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "child_profiles_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "parents"; referencedColumns: ["id"] },
        ];
      };
      child_progress: {
        Row: {
          id: string;
          child_id: string;
          skill_slug: string;
          domain: string;
          evidence: Json;
          revision: number;
          last_practiced_at: string | null;
          review_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          skill_slug: string;
          domain: string;
          evidence?: Json;
          revision?: number;
          last_practiced_at?: string | null;
          review_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          skill_slug?: string;
          domain?: string;
          evidence?: Json;
          revision?: number;
          last_practiced_at?: string | null;
          review_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "child_progress_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
        ];
      };
      child_rewards: {
        Row: {
          id: string;
          child_id: string;
          reward_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          reward_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          reward_id?: string;
          earned_at?: string;
        };
        Relationships: [
          { foreignKeyName: "child_rewards_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "child_rewards_reward_id_fkey"; columns: ["reward_id"]; isOneToOne: false; referencedRelation: "rewards"; referencedColumns: ["id"] },
        ];
      };
      learning_sessions: {
        Row: {
          id: string;
          child_id: string;
          kind: string;
          status: string;
          state: Json;
          active_seconds: number;
          revision: number;
          started_at: string;
          completed_at: string | null;
          suspended_at: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          kind: string;
          status?: string;
          state?: Json;
          active_seconds?: number;
          revision?: number;
          started_at?: string;
          completed_at?: string | null;
          suspended_at?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          kind?: string;
          status?: string;
          state?: Json;
          active_seconds?: number;
          revision?: number;
          started_at?: string;
          completed_at?: string | null;
          suspended_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "learning_sessions_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
        ];
      };
      lessons: {
        Row: {
          id: string;
          unit_id: string;
          slug: string;
          version: number;
          title: string;
          position: number;
          published: boolean;
          metadata: Json;
        };
        Insert: {
          id?: string;
          unit_id: string;
          slug: string;
          version?: number;
          title: string;
          position?: number;
          published?: boolean;
          metadata?: Json;
        };
        Update: {
          id?: string;
          unit_id?: string;
          slug?: string;
          version?: number;
          title?: string;
          position?: number;
          published?: boolean;
          metadata?: Json;
        };
        Relationships: [
          { foreignKeyName: "lessons_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] },
        ];
      };
      media_assets: {
        Row: {
          id: string;
          parent_id: string | null;
          slug: string;
          title: string;
          media_type: string;
          bucket: string | null;
          object_path: string | null;
          bundled_path: string | null;
          metadata: Json;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          slug: string;
          title: string;
          media_type: string;
          bucket?: string | null;
          object_path?: string | null;
          bundled_path?: string | null;
          metadata?: Json;
          published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          slug?: string;
          title?: string;
          media_type?: string;
          bucket?: string | null;
          object_path?: string | null;
          bundled_path?: string | null;
          metadata?: Json;
          published?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "media_assets_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "parents"; referencedColumns: ["id"] },
        ];
      };
      parents: {
        Row: {
          id: string;
          display_name: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "parents_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      questions: {
        Row: {
          id: string;
          activity_id: string;
          slug: string;
          prompt: string;
          options: Json;
          hint: string;
          position: number;
        };
        Insert: {
          id?: string;
          activity_id: string;
          slug: string;
          prompt: string;
          options?: Json;
          hint?: string;
          position?: number;
        };
        Update: {
          id?: string;
          activity_id?: string;
          slug?: string;
          prompt?: string;
          options?: Json;
          hint?: string;
          position?: number;
        };
        Relationships: [
          { foreignKeyName: "questions_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "activities"; referencedColumns: ["id"] },
        ];
      };
      reward_events: {
        Row: {
          id: string;
          child_id: string;
          amount: number;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          amount: number;
          source: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          amount?: number;
          source?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "reward_events_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
        ];
      };
      rewards: {
        Row: {
          id: string;
          slug: string;
          title: string;
          kind: string;
          presentation: Json;
          published: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          kind: string;
          presentation?: Json;
          published?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          kind?: string;
          presentation?: Json;
          published?: boolean;
        };
        Relationships: [
        ];
      };
      subjects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          position: number;
          published: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          position?: number;
          published?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          position?: number;
          published?: boolean;
        };
        Relationships: [
        ];
      };
      units: {
        Row: {
          id: string;
          subject_id: string;
          slug: string;
          title: string;
          grade: string;
          position: number;
          published: boolean;
        };
        Insert: {
          id?: string;
          subject_id: string;
          slug: string;
          title: string;
          grade: string;
          position?: number;
          published?: boolean;
        };
        Update: {
          id?: string;
          subject_id?: string;
          slug?: string;
          title?: string;
          grade?: string;
          position?: number;
          published?: boolean;
        };
        Relationships: [
          { foreignKeyName: "units_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] },
        ];
      };
      world_item_placements: {
        Row: {
          id: string;
          child_id: string;
          slot: string;
          reward_id: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          slot: string;
          reward_id: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          slot?: string;
          reward_id?: string;
        };
        Relationships: [
          { foreignKeyName: "world_item_placements_child_id_fkey"; columns: ["child_id"]; isOneToOne: false; referencedRelation: "child_profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "world_item_placements_child_id_reward_id_fkey"; columns: ["child_id","reward_id"]; isOneToOne: true; referencedRelation: "child_rewards"; referencedColumns: ["child_id","reward_id"] },
          { foreignKeyName: "world_item_placements_reward_id_fkey"; columns: ["reward_id"]; isOneToOne: false; referencedRelation: "rewards"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      backend_version: { Args: { [_ in never]: never }; Returns: string };
      cq_commit: { Args: { p_parent: string; p_kind: string; p_data: Json }; Returns: Json };
      cq_import: { Args: { p_parent: string; p_bundle: Json; p_hash: string }; Returns: Json };
      cq_read: { Args: { p_parent: string; p_kind: string; p_child?: string | null; p_id?: string | null; p_filter?: string | null; p_limit?: number | null; p_offset?: number | null }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
