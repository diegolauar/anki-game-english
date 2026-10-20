export const FINDING_CATEGORIES = [
  "grammar.verb_tense",
  "grammar.agreement",
  "grammar.articles",
  "grammar.prepositions",
  "grammar.word_order",
  "grammar.sentence_structure",
  "vocabulary.word_choice",
  "vocabulary.out_of_context",
  "vocabulary.precision",
  "naturalness.unnatural_expression",
  "naturalness.literal_translation",
  "naturalness.collocation",
  "communication.incomplete",
  "communication.ambiguous",
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];
