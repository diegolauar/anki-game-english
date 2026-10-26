"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MessageRole } from "@/domain/value-objects/message-role";

export interface TranscriptFinding {
  id: string;
  startOffset: number;
  endOffset: number;
  kind: "error" | "suggestion";
  category: string;
  originalText: string;
  correction: string | null;
  explanation: string | null;
  example: string | null;
  occurrenceCount: number | null;
}

export interface TranscriptMessage {
  id: string;
  role: MessageRole;
  content: string;
  findings: TranscriptFinding[];
}

function renderHighlighted(
  content: string,
  findings: TranscriptFinding[],
  selectedId: string | null,
  onSelect: (finding: TranscriptFinding) => void,
): ReactNode {
  if (findings.length === 0) return content;

  const sortedFindings = [...findings].sort((a, b) => a.startOffset - b.startOffset);
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const finding of sortedFindings) {
    if (finding.startOffset > cursor) {
      parts.push(content.slice(cursor, finding.startOffset));
    }
    const isSelected = finding.id === selectedId;
    const isError = finding.kind === "error";
    parts.push(
      <button
        key={finding.id}
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(finding)}
        className={`rounded-[5px] px-[3px] py-[2px] font-semibold transition-colors ${
          isSelected
            ? isError
              ? "bg-err text-white"
              : "bg-sug text-ink"
            : isError
              ? "border-b-2 border-err bg-err-soft"
              : "border-b-2 border-dashed border-sug bg-sug-soft"
        }`}
      >
        {content.slice(finding.startOffset, finding.endOffset)}
      </button>,
    );
    cursor = Math.max(cursor, finding.endOffset);
  }

  if (cursor < content.length) parts.push(content.slice(cursor));

  return parts;
}

export function TranscriptView({ messages }: { messages: TranscriptMessage[] }) {
  const t = useTranslations("conversation.results.transcript");
  const firstFinding = messages.flatMap((message) => message.findings)[0] ?? null;
  const [selected, setSelected] = useState<TranscriptFinding | null>(firstFinding);

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(280px,360px)" }}>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.01em]">{t("heading")}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 rounded-full bg-err" /> {t("errorLegend")}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 rounded-full border-b-2 border-dashed border-sug" />{" "}
              {t("suggestionLegend")}
            </span>
          </div>
        </div>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">{t("clickHint")}</p>

        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "assistant" ? (
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-bold tracking-[.04em] uppercase">{t("aiLabel")}</span>{" "}
                  {message.content}
                </p>
              ) : (
                <div className="rounded-control bg-surface2 p-4 text-[15.5px] leading-[1.75]">
                  <p className="mb-1 text-[11px] font-bold tracking-[.04em] text-acc uppercase">
                    {t("youLabel")}
                  </p>
                  {renderHighlighted(message.content, message.findings, selected?.id ?? null, setSelected)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-card border border-line bg-surface p-6" style={{ position: "sticky", top: "1.5rem" }}>
        {!selected ? (
          <p className="text-sm text-muted-foreground">{t("noHighlights")}</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  selected.kind === "error" ? "bg-err-soft text-err" : "bg-sug-soft text-sug-ink"
                }`}
              >
                {selected.kind === "error" ? t("errorLegend") : t("suggestionLegend")}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{selected.category}</span>
            </div>

            <p className="mt-4 text-base text-muted-foreground line-through">
              {selected.originalText}
            </p>
            {selected.correction && (
              <p className="mt-1 font-display text-[22px] font-bold text-acc-strong">
                {selected.correction}
              </p>
            )}
            {selected.explanation && (
              <p className="mt-3 text-[15px]">{selected.explanation}</p>
            )}
            {selected.example && (
              <p className="mt-3 rounded-control bg-surface2 p-3 text-[13px] italic">
                <span className="not-italic font-bold tracking-[.04em] text-muted-foreground uppercase">
                  {t("exampleLabel")}
                </span>{" "}
                {selected.example}
              </p>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <History className="size-3.5" />
              {selected.occurrenceCount && selected.occurrenceCount >= 3
                ? t("recurrence.frequent", { count: selected.occurrenceCount })
                : selected.occurrenceCount && selected.occurrenceCount > 1
                  ? t("recurrence.seen", { count: selected.occurrenceCount })
                  : t("recurrence.first")}
            </p>

            <Link
              href={`/flashcards/new?front=${encodeURIComponent(
                selected.explanation ?? "",
              )}&back=${encodeURIComponent(selected.correction ?? selected.originalText)}`}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-control border border-line text-sm font-semibold hover:border-acc hover:text-acc-strong"
            >
              {t("createFlashcard")}
            </Link>
          </>
        )}
      </aside>
    </div>
  );
}
