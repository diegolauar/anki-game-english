"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, PauseCircle, Search } from "lucide-react";
import { toggleFlashcardSuspensionAction } from "@/app/flashcards/actions";
import type { CardType } from "@/domain/value-objects/card-type";

const CARD_TYPE_LABELS: Record<CardType, string> = {
  production: "Produção",
  cloze: "Lacuna",
  manual: "Manual",
};

export interface FlashcardRow {
  id: string;
  front: string;
  back: string;
  category: string | null;
  cardType: CardType;
  suspended: boolean;
  dueLabel: string;
  dueClassName: string;
}

export function FlashcardsList({ rows }: { rows: FlashcardRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) => row.front.toLowerCase().includes(needle) || row.back.toLowerCase().includes(needle),
    );
  }, [rows, query]);

  return (
    <div>
      <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-surface px-4" style={{ height: 44, maxWidth: 240 }}>
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum cartão aqui por enquanto.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="grid items-center gap-3 p-4 max-sm:grid-cols-1 sm:grid-cols-[1.3fr_1fr_120px_110px_84px]"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{row.front}</p>
                <p className="truncate text-sm text-muted-foreground">{row.back}</p>
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {row.category ?? "—"}
              </p>
              <p className="text-xs font-bold tracking-[.04em] text-acc uppercase">
                {CARD_TYPE_LABELS[row.cardType]}
              </p>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${row.dueClassName}`}
              >
                {row.dueLabel}
              </span>
              <div className="flex items-center gap-1.5 max-sm:justify-end">
                <Link
                  href={`/flashcards/${row.id}/edit`}
                  aria-label="Editar"
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface2"
                >
                  <Pencil className="size-4" />
                </Link>
                <form action={toggleFlashcardSuspensionAction}>
                  <input type="hidden" name="flashcardId" value={row.id} />
                  <button
                    type="submit"
                    aria-label={row.suspended ? "Reativar" : "Suspender"}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface2"
                  >
                    <PauseCircle className="size-4" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
