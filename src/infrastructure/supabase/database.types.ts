
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "analyses": {
                  Row: {
                    "attempts": number,"completed_at": string | null,"conversation_id": string,"created_at": string,"error_message": string | null,"id": string,"model": string | null,"status": string,"summary": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"completed_at"?: string | null,"conversation_id": string,"created_at"?: string,"error_message"?: string | null,"id"?: string,"model"?: string | null,"status"?: string,"summary"?: Json | null
                  }
                  Update: {
                    "attempts"?: number,"completed_at"?: string | null,"conversation_id"?: string,"created_at"?: string,"error_message"?: string | null,"id"?: string,"model"?: string | null,"status"?: string,"summary"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "analyses_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"card_schedules": {
                  Row: {
                    "difficulty": number,"due_at": string,"flashcard_id": string,"lapses": number,"last_reviewed_at": string | null,"reps": number,"stability": number,"state": string
                  }
                  ComputedFields: never
                  Insert: {
                    "difficulty"?: number,"due_at"?: string,"flashcard_id": string,"lapses"?: number,"last_reviewed_at"?: string | null,"reps"?: number,"stability"?: number,"state"?: string
                  }
                  Update: {
                    "difficulty"?: number,"due_at"?: string,"flashcard_id"?: string,"lapses"?: number,"last_reviewed_at"?: string | null,"reps"?: number,"stability"?: number,"state"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "card_schedules_flashcard_id_fkey"
      columns: ["flashcard_id"]
isOneToOne: true
      referencedRelation: "flashcards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "card_schedules_flashcard_id_fkey"
      columns: ["flashcard_id"]
isOneToOne: true
      referencedRelation: "flashcards_with_schedule"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"custom_topic": string | null,"difficulty": string,"ended_at": string | null,"id": string,"started_at": string,"status": string,"topic_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"custom_topic"?: string | null,"difficulty": string,"ended_at"?: string | null,"id"?: string,"started_at"?: string,"status"?: string,"topic_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"custom_topic"?: string | null,"difficulty"?: string,"ended_at"?: string | null,"id"?: string,"started_at"?: string,"status"?: string,"topic_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"findings": {
                  Row: {
                    "analysis_id": string,"category": string,"correction": string | null,"created_at": string,"end_offset": number,"example": string | null,"explanation": string | null,"id": string,"kind": string,"learning_point_id": string | null,"message_id": string,"original_text": string,"severity": string,"start_offset": number
                  }
                  ComputedFields: never
                  Insert: {
                    "analysis_id": string,"category": string,"correction"?: string | null,"created_at"?: string,"end_offset": number,"example"?: string | null,"explanation"?: string | null,"id"?: string,"kind": string,"learning_point_id"?: string | null,"message_id": string,"original_text": string,"severity": string,"start_offset": number
                  }
                  Update: {
                    "analysis_id"?: string,"category"?: string,"correction"?: string | null,"created_at"?: string,"end_offset"?: number,"example"?: string | null,"explanation"?: string | null,"id"?: string,"kind"?: string,"learning_point_id"?: string | null,"message_id"?: string,"original_text"?: string,"severity"?: string,"start_offset"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "findings_analysis_id_fkey"
      columns: ["analysis_id"]
isOneToOne: false
      referencedRelation: "analyses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_learning_point_id_fkey"
      columns: ["learning_point_id"]
isOneToOne: false
      referencedRelation: "learning_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "findings_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "user_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"flashcards": {
                  Row: {
                    "back": string,"card_type": string,"created_at": string,"explanation": string | null,"front": string,"id": string,"learning_point_id": string | null,"source_finding_id": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "back": string,"card_type": string,"created_at"?: string,"explanation"?: string | null,"front": string,"id"?: string,"learning_point_id"?: string | null,"source_finding_id"?: string | null,"status"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "back"?: string,"card_type"?: string,"created_at"?: string,"explanation"?: string | null,"front"?: string,"id"?: string,"learning_point_id"?: string | null,"source_finding_id"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "flashcards_learning_point_id_fkey"
      columns: ["learning_point_id"]
isOneToOne: false
      referencedRelation: "learning_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "flashcards_source_finding_id_fkey"
      columns: ["source_finding_id"]
isOneToOne: false
      referencedRelation: "findings"
      referencedColumns: ["id"]
    }
                  ]
                },"learning_points": {
                  Row: {
                    "canonical_correction": string | null,"category": string,"explanation": string | null,"first_seen_at": string,"id": string,"kind": string,"last_seen_at": string,"occurrence_count": number,"rule_key": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "canonical_correction"?: string | null,"category": string,"explanation"?: string | null,"first_seen_at"?: string,"id"?: string,"kind": string,"last_seen_at"?: string,"occurrence_count"?: number,"rule_key": string,"user_id": string
                  }
                  Update: {
                    "canonical_correction"?: string | null,"category"?: string,"explanation"?: string | null,"first_seen_at"?: string,"id"?: string,"kind"?: string,"last_seen_at"?: string,"occurrence_count"?: number,"rule_key"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"llm_usage_logs": {
                  Row: {
                    "completion_tokens": number,"created_at": string,"id": string,"model": string,"prompt_tokens": number,"source": string,"total_tokens": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completion_tokens"?: number,"created_at"?: string,"id"?: string,"model": string,"prompt_tokens"?: number,"source": string,"total_tokens"?: number,"user_id": string
                  }
                  Update: {
                    "completion_tokens"?: number,"created_at"?: string,"id"?: string,"model"?: string,"prompt_tokens"?: number,"source"?: string,"total_tokens"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"messages": {
                  Row: {
                    "client_message_id": string,"content": string,"conversation_id": string,"created_at": string,"id": string,"input_mode": string,"role": string,"sequence": number
                  }
                  ComputedFields: never
                  Insert: {
                    "client_message_id": string,"content": string,"conversation_id": string,"created_at"?: string,"id"?: string,"input_mode": string,"role": string,"sequence": number
                  }
                  Update: {
                    "client_message_id"?: string,"content"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"input_mode"?: string,"role"?: string,"sequence"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"review_logs": {
                  Row: {
                    "elapsed_days": number,"flashcard_id": string,"id": string,"rating": string,"reviewed_at": string,"scheduled_days": number,"state_before": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "elapsed_days"?: number,"flashcard_id": string,"id"?: string,"rating": string,"reviewed_at"?: string,"scheduled_days"?: number,"state_before": string,"user_id": string
                  }
                  Update: {
                    "elapsed_days"?: number,"flashcard_id"?: string,"id"?: string,"rating"?: string,"reviewed_at"?: string,"scheduled_days"?: number,"state_before"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_logs_flashcard_id_fkey"
      columns: ["flashcard_id"]
isOneToOne: false
      referencedRelation: "flashcards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_logs_flashcard_id_fkey"
      columns: ["flashcard_id"]
isOneToOne: false
      referencedRelation: "flashcards_with_schedule"
      referencedColumns: ["id"]
    }
                  ]
                },"speech_transcriptions": {
                  Row: {
                    "audio_duration_ms": number | null,"created_at": string,"id": string,"message_id": string,"provider": string,"raw_text": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audio_duration_ms"?: number | null,"created_at"?: string,"id"?: string,"message_id": string,"provider": string,"raw_text": string
                  }
                  Update: {
                    "audio_duration_ms"?: number | null,"created_at"?: string,"id"?: string,"message_id"?: string,"provider"?: string,"raw_text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "speech_transcriptions_message_id_fkey"
      columns: ["message_id"]
isOneToOne: true
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "speech_transcriptions_message_id_fkey"
      columns: ["message_id"]
isOneToOne: true
      referencedRelation: "user_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"stripe_webhook_events": {
                  Row: {
                    "id": string,"processed_at": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"processed_at"?: string,"type": string
                  }
                  Update: {
                    "id"?: string,"processed_at"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"created_at": string,"current_period_end": string | null,"status": string,"stripe_customer_id": string,"stripe_subscription_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"status"?: string,"stripe_customer_id": string,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"status"?: string,"stripe_customer_id"?: string,"stripe_subscription_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"topics": {
                  Row: {
                    "category": string | null,"created_at": string,"description": string | null,"description_en_us": string | null,"description_es": string | null,"difficulty": string,"id": string,"is_active": boolean,"slug": string,"title": string,"title_en_us": string | null,"title_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"description"?: string | null,"description_en_us"?: string | null,"description_es"?: string | null,"difficulty": string,"id"?: string,"is_active"?: boolean,"slug": string,"title": string,"title_en_us"?: string | null,"title_es"?: string | null
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"description"?: string | null,"description_en_us"?: string | null,"description_es"?: string | null,"difficulty"?: string,"id"?: string,"is_active"?: boolean,"slug"?: string,"title"?: string,"title_en_us"?: string | null,"title_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"user_profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"preferences": NonNullable<Json>,"target_level": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"preferences"?: NonNullable<Json>,"target_level"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"preferences"?: NonNullable<Json>,"target_level"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"xp_events": {
                  Row: {
                    "amount": number,"created_at": string,"id": string,"source_id": string,"source_type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"id"?: string,"source_id": string,"source_type": string,"user_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"id"?: string,"source_id"?: string,"source_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "flashcards_with_schedule": {
                  Row: {
                    "back": string | null,"card_type": string | null,"created_at": string | null,"difficulty": number | null,"due_at": string | null,"explanation": string | null,"front": string | null,"id": string | null,"lapses": number | null,"last_reviewed_at": string | null,"learning_point_id": string | null,"reps": number | null,"source_finding_id": string | null,"stability": number | null,"state": string | null,"status": string | null,"updated_at": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "flashcards_learning_point_id_fkey"
      columns: ["learning_point_id"]
isOneToOne: false
      referencedRelation: "learning_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "flashcards_source_finding_id_fkey"
      columns: ["source_finding_id"]
isOneToOne: false
      referencedRelation: "findings"
      referencedColumns: ["id"]
    }
                  ]
                },"user_messages": {
                  Row: {
                    "audio_duration_ms": number | null,"content": string | null,"conversation_id": string | null,"created_at": string | null,"id": string | null,"input_mode": string | null,"role": string | null,"sequence": number | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
