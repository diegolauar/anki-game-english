import Link from "next/link";
import { Pencil, PauseCircle } from "lucide-react";
import { toggleFlashcardSuspensionAction } from "@/app/flashcards/actions";
import { CARD_TYPE_LABELS } from "@/lib/card-type-labels";
import type { CardType } from "@/domain/value-objects/card-type";

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
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">Nenhum cartão aqui por enquanto.</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
      {rows.map((row) => (
        <li
          key={row.id}
          className="grid items-center gap-3 p-4 max-sm:grid-cols-1 sm:grid-cols-[1.3fr_1fr_120px_110px_84px]"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{row.front}</p>
            <p className="truncate text-sm text-muted-foreground">{row.back}</p>
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.category ?? "—"}</p>
          <p className="text-xs font-bold tracking-[.04em] text-acc uppercase">
            {CARD_TYPE_LABELS[row.cardType]}
          </p>
          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${row.dueClassName}`}>
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
  );
}
