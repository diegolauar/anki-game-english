import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from("user_profiles")
      .select("id, display_name, target_level, preferences")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      displayName: data.display_name,
      targetLevel: data.target_level as Difficulty,
      preferences: (data.preferences as Record<string, unknown>) ?? {},
    };
  }
}
