import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic } from "@/domain/entities/topic";
import type { Difficulty } from "@/domain/value-objects/difficulty";
import type { Locale } from "@/domain/value-objects/locale";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { Database } from "@/infrastructure/supabase/database.types";

const TOPIC_COLUMNS =
  "id, slug, title, title_en_us, title_es, description, description_en_us, description_es, category, difficulty";

type TopicRow = Pick<
  Database["public"]["Tables"]["topics"]["Row"],
  | "id"
  | "slug"
  | "title"
  | "title_en_us"
  | "title_es"
  | "description"
  | "description_en_us"
  | "description_es"
  | "category"
  | "difficulty"
>;

/** `title`/`description` são o pt-BR histórico; as colunas `_en_us`/`_es` são opcionais e caem pro pt-BR se faltar tradução. */
function toTopic(row: TopicRow, locale: Locale): Topic {
  const title = (locale === "en-US" ? row.title_en_us : locale === "es" ? row.title_es : null) ?? row.title;
  const description =
    (locale === "en-US" ? row.description_en_us : locale === "es" ? row.description_es : null) ??
    row.description;

  return {
    id: row.id,
    slug: row.slug,
    title,
    description,
    category: row.category,
    difficulty: row.difficulty as Difficulty,
  };
}

export class SupabaseTopicRepository implements TopicRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listActive(locale: Locale): Promise<Topic[]> {
    const { data, error } = await this.client
      .from("topics")
      .select(TOPIC_COLUMNS)
      .eq("is_active", true)
      .order("title");

    if (error) throw error;

    return data.map((row) => toTopic(row, locale));
  }

  async findById(id: string, locale: Locale): Promise<Topic | null> {
    const { data, error } = await this.client
      .from("topics")
      .select(TOPIC_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toTopic(data, locale) : null;
  }
}
