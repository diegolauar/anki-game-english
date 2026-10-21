import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { importFlashcardsAction } from "@/app/flashcards/actions";
import { requireUser } from "@/infrastructure/supabase/require-user";

export default async function ImportFlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; skipped?: string; error?: string }>;
}) {
  await requireUser();

  const { created, skipped, error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 pt-10 pb-[60px] sm:px-10">
      <Link
        href="/flashcards"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Flashcards
      </Link>
      <h1 className="mt-2 font-display text-[32px] font-bold tracking-[-0.02em]">
        Importar flashcards de um arquivo
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Envie um arquivo .csv ou .txt com as colunas <strong>front</strong> e{" "}
        <strong>back</strong> (e opcionalmente <strong>explanation</strong>), separadas por vírgula,
        ponto-e-vírgula ou tab. Cada linha vira um cartão manual, já pronto para revisar.
      </p>

      {error && (
        <p className="mt-4 rounded-control bg-err-soft p-3 text-sm text-err">{error}</p>
      )}
      {created !== undefined && !error && (
        <p className="mt-4 rounded-control bg-acc-soft p-3 text-sm text-acc-strong">
          {created} cartão{created === "1" ? "" : "s"} importado{created === "1" ? "" : "s"}.
          {skipped && skipped !== "0" ? ` ${skipped} linha${skipped === "1" ? "" : "s"} ignorada${skipped === "1" ? "" : "s"}.` : ""}
        </p>
      )}

      <form action={importFlashcardsAction} className="mt-6 flex flex-col gap-4">
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-muted-foreground hover:border-acc"
        >
          <Upload className="size-6" />
          <span>Escolha um arquivo .csv ou .txt</span>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            required
            className="hidden"
          />
        </label>

        <button
          type="submit"
          className="flex h-12 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink"
        >
          Importar
        </button>
      </form>

      <div className="mt-8 rounded-card border border-line bg-surface p-4 text-sm">
        <p className="font-bold">Exemplo em CSV (vírgula)</p>
        <pre className="mt-2 overflow-x-auto rounded-control bg-bg p-3 text-[12.5px] text-muted-foreground">
{`front,back,explanation
Como digo "bom dia"?,Good morning,
Como digo que trabalhei muito ontem?,I worked a lot yesterday,Simple Past para ação concluída`}
        </pre>
        <p className="mt-3 font-bold">Exemplo em .txt (ponto-e-vírgula)</p>
        <pre className="mt-2 overflow-x-auto rounded-control bg-bg p-3 text-[12.5px] text-muted-foreground">
{`front;back;explanation
Como digo "bom dia"?;Good morning;
Como digo que trabalhei muito ontem?;I worked a lot yesterday;Simple Past para ação concluída`}
        </pre>
      </div>
    </main>
  );
}
