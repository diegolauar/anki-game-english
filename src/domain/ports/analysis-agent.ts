import type { AnalysisSummary } from "@/domain/entities/analysis";
import type { FindingCategory } from "@/domain/value-objects/finding-category";
import type { FindingKind } from "@/domain/value-objects/finding-kind";
import type { Locale } from "@/domain/value-objects/locale";
import type { MessageRole } from "@/domain/value-objects/message-role";
import type { Severity } from "@/domain/value-objects/severity";

export interface AnalysisAgentMessage {
  sequence: number;
  role: MessageRole;
  content: string;
}

export interface AnalysisAgentInput {
  messages: AnalysisAgentMessage[];
  existingRuleKeys: string[];
  /** Idioma das explicações (seção 5.3) — segue o uiLanguage do usuário. */
  explanationLanguage: Locale;
}

export interface AnalysisFlashcardSuggestion {
  cardType: "production" | "cloze";
  front: string;
  back: string;
}

export interface AnalysisFindingResult {
  messageSequence: number;
  originalText: string;
  startOffset: number;
  endOffset: number;
  kind: FindingKind;
  severity: Severity;
  category: FindingCategory;
  ruleKey: string;
  correction: string | null;
  explanation: string | null;
  example: string | null;
  flashcardSuggestion: AnalysisFlashcardSuggestion | null;
}

export interface AnalysisAgentResult {
  summary: AnalysisSummary;
  findings: AnalysisFindingResult[];
}

export interface AnalysisAgent {
  readonly modelId: string;
  analyze(input: AnalysisAgentInput): Promise<AnalysisAgentResult>;
}
