import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfileWriter } from "@/domain/ports/user-profile-writer";
import type { Database, Json } from "@/infrastructure/supabase/database.types";

export class SupabaseUserProfileWriter implements UserProfileWriter {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async updatePreferences(userId: string, patch: Record<string, unknown>): Promise<void> {
    const { data, error: readError } = await this.client
      .from("user_profiles")
      .select("preferences")
      .eq("id", userId)
      .maybeSingle();
    if (readError) throw readError;

    const merged = {
      ...((data?.preferences as Record<string, unknown>) ?? {}),
      ...patch,
    } as unknown as NonNullable<Json>;

    const { error: writeError } = await this.client
      .from("user_profiles")
      .update({ preferences: merged })
      .eq("id", userId);
    if (writeError) throw writeError;
  }
}
