export const LLM_USAGE_SOURCES = ["conversation", "analysis"] as const;

export type LlmUsageSource = (typeof LLM_USAGE_SOURCES)[number];
