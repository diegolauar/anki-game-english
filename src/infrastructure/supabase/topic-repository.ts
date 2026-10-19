import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic } from "@/domain/entities/topic";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseTopicRepository implements TopicRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listActive(): Promise<Topic[]> {
    const { data, error } = await this.client
      .from("topics")
      .select("id, slug, title, description, category, difficulty")
      .eq("is_active", true)
      .order("title");

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty as Difficulty,
    }));
  }
}
