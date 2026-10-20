export const FINDING_KINDS = ["error", "suggestion"] as const;

export type FindingKind = (typeof FINDING_KINDS)[number];
