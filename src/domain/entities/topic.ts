import type { Difficulty } from "@/domain/value-objects/difficulty";

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
}
