import type { Difficulty } from "@/domain/value-objects/difficulty";

export interface UserProfile {
  id: string;
  displayName: string | null;
  targetLevel: Difficulty;
  preferences: Record<string, unknown>;
}
