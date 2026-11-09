import { z } from "zod";
import { FINDING_CATEGORIES } from "@/domain/value-objects/finding-category";
import { FINDING_KINDS } from "@/domain/value-objects/finding-kind";
import { SEVERITIES } from "@/domain/value-objects/severity";

const RULE_KEY_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/;

const flashcardSuggestionSchema = z.object({
  card_type: z.enum(["production", "cloze"]),
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(500),
});

const findingSchema = z.object({
  message_sequence: z.number().int().positive(),
  original_text: z.string().min(1).max(2000),
  start_offset: z.number().int().min(0),
  end_offset: z.number().int().min(0),
  kind: z.enum(FINDING_KINDS),
  severity: z.enum(SEVERITIES),
  category: z.enum(FINDING_CATEGORIES),
  rule_key: z.string().min(1).max(100).regex(RULE_KEY_PATTERN),
  correction: z.string().max(500).nullable().optional(),
  explanation: z.string().max(1000).nullable().optional(),
  example: z.string().max(500).nullable().optional(),
  flashcard_suggestion: flashcardSuggestionSchema.nullable().optional(),
});

export const analysisResponseSchema = z.object({
  summary: z.object({
    main_points: z.array(z.string().max(300)).max(10),
    recommended_expressions: z.array(z.string().max(200)).max(10),
  }),
  findings: z.array(findingSchema).max(8),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
