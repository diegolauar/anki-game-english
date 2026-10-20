import type { Difficulty } from "@/domain/value-objects/difficulty";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: "Frases simples, ritmo calmo.",
  intermediate: "Conversa natural com vocabulário do dia a dia.",
  advanced: "Expressões idiomáticas e temas complexos.",
};
