import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Flame,
  Layers,
  MessagesSquare,
  Mic,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";

const STEPS = [
  {
    icon: MessagesSquare,
    title: "1 · Converse",
    description:
      "Escolha um tema e fale à vontade, em texto ou voz. A IA conversa com você — sem corrigir nada no meio do caminho.",
  },
  {
    icon: Sparkles,
    title: "2 · Entenda",
    description:
      "No final, a IA analisa a conversa inteira, destaca o que pode melhorar e explica em português, com exemplos.",
  },
  {
    icon: Layers,
    title: "3 · Revise",
    description:
      "Os pontos viram flashcards com repetição espaçada. O mesmo erro em conversas diferentes reforça o mesmo cartão.",
  },
] as const;

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Conversa sem julgamento",
    description:
      "Pratique sobre o que quiser, no seu nível. As correções nunca interrompem a conversa.",
  },
  {
    icon: Mic,
    title: "Texto ou voz",
    description:
      "Fale ou digite — você escolhe. A transcrição por voz preserva seus erros de propósito, pra análise ser real.",
  },
  {
    icon: Sparkles,
    title: "Análise que explica o porquê",
    description:
      "Cada correção vem com explicação em português e um exemplo, não só a frase certa.",
  },
  {
    icon: Flame,
    title: "Progresso que gruda",
    description:
      "Flashcards com FSRS (o mesmo algoritmo do Anki), XP e streak — pra prática virar hábito.",
  },
] as const;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-acc text-acc-ink">
              <span className="font-display text-lg font-extrabold">Q</span>
            </span>
            <span className="font-display text-lg font-bold">English Quest</span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground sm:flex">
            <a href="#como-funciona" className="hover:text-ink">
              Como funciona
            </a>
            <a href="#recursos" className="hover:text-ink">
              Recursos
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden h-11 items-center rounded-full px-4 text-sm font-bold text-ink hover:bg-surface2 sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-acc px-4 text-sm font-bold text-acc-ink sm:px-5"
            >
              Começar agora <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-6 pt-14 pb-16 sm:px-10 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-acc-soft px-3.5 py-1.5 text-xs font-bold tracking-[.04em] text-acc-strong uppercase">
              Pra quem já estudou inglês mas trava na hora de falar
            </span>
            <h1 className="mt-5 font-display text-[44px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[56px]">
              Fale inglês sem medo de errar.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Converse com uma IA sobre o que você gosta, no seu nível. As correções vêm só no
              final — explicadas em português e transformadas em flashcards pra você não esquecer.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center gap-2 rounded-full bg-acc px-6 text-[15px] font-bold text-acc-ink"
              >
                Começar agora <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center rounded-full border border-line px-6 text-[15px] font-bold hover:border-acc"
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-10 size-64 rounded-full bg-acc-soft"
            />
            <div className="relative flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card">
              <div className="w-fit max-w-[85%] self-end rounded-[18px_18px_4px_18px] bg-acc px-4 py-3 text-[15px] text-acc-ink">
                Yesterday I <span className="underline decoration-2 underline-offset-2">have worked</span>{" "}
                a lot on the project.
              </div>
              <div className="w-fit max-w-[85%] rounded-[18px_18px_18px_4px] bg-surface2 px-4 py-3 text-[15px]">
                Oh nice, what were you working on?
              </div>
              <div className="mt-2 rounded-control bg-err-soft p-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-err text-xs font-bold text-white">
                    !
                  </span>
                  <div>
                    <p>
                      <span className="text-muted-foreground line-through">have worked</span> →{" "}
                      <span className="font-semibold text-acc-strong">worked</span>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Com &ldquo;yesterday&rdquo;, use o Simple Past.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-line bg-surface2/60 py-16">
        <div className="mx-auto max-w-[1120px] px-6 sm:px-10">
          <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">
            Como funciona
          </h2>
          <div
            className="mt-8 grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-card border border-line bg-surface p-6">
                <span className="flex size-11 items-center justify-center rounded-control bg-acc-soft text-acc-strong">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-[1120px] px-6 py-16 sm:px-10">
        <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">
          Feito pra prática real
        </h2>
        <div
          className="mt-8 grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-card border border-line bg-surface p-6">
              <span className="flex size-11 items-center justify-center rounded-control bg-acc-soft text-acc-strong">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 pb-20 sm:px-10">
        <div className="relative overflow-hidden rounded-card bg-acc px-8 py-12 text-center text-acc-ink sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -left-20 size-72 rounded-full bg-acc-ink/10"
          />
          <h2 className="relative font-display text-[32px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[40px]">
            Pronto pra sua primeira conversa?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm opacity-90">
            Cadastre-se com Google ou e-mail. Sem senha, sem complicação.
          </p>
          <Link
            href="/login"
            className="relative mt-7 inline-flex h-[52px] items-center gap-2 rounded-full bg-acc-ink px-7 text-[15px] font-bold text-acc"
          >
            Começar agora <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:px-10">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[9px] bg-acc text-acc-ink">
              <span className="font-display text-sm font-extrabold">Q</span>
            </span>
            <span className="font-display font-bold text-ink">English Quest</span>
          </div>
          <p>Áudios de voz nunca são armazenados.</p>
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Entrar
          </Link>
        </div>
      </footer>
    </main>
  );
}
