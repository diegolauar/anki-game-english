"use client";

import { useState, type ReactNode } from "react";
import type { MessageRole } from "@/domain/value-objects/message-role";

export interface TranscriptFinding {
  id: string;
  startOffset: number;
  endOffset: number;
  kind: "error" | "suggestion";
  originalText: string;
  correction: string | null;
  explanation: string | null;
  example: string | null;
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
    parts.push(
      <button
        key={finding.id}
        type="button"
        onClick={() => onSelect(finding)}
        className={`rounded px-0.5 underline decoration-2 ${
          finding.kind === "error"
            ? "bg-red-500/15 decoration-red-500"
            : "bg-amber-500/15 decoration-amber-500"
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
  const [selected, setSelected] = useState<TranscriptFinding | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            {renderHighlighted(message.content, message.findings, setSelected)}
          </div>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">&ldquo;{selected.originalText}&rdquo;</p>
          {selected.correction && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Correção: </span>
              {selected.correction}
            </p>
          )}
          {selected.explanation && <p className="mt-2 text-sm">{selected.explanation}</p>}
          {selected.example && (
            <p className="mt-2 text-sm text-muted-foreground">Exemplo: {selected.example}</p>
          )}
        </div>
      )}
    </div>
  );
}
