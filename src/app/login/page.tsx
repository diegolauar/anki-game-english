"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? "error" : "sent");
  }

  async function handleGoogleLogin() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="grid min-h-dvh flex-1 grid-cols-1 max-[900px]:grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-acc p-12 text-acc-ink md:flex lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-[520px] rounded-full bg-acc-ink/[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 size-[300px] rounded-full bg-acc-ink/[0.06]"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[11px] bg-acc-ink text-acc">
            <span className="font-display text-lg font-extrabold">Q</span>
          </span>
          <span className="font-display text-lg font-bold">English Quest</span>
        </div>

        <div className="relative flex flex-col gap-6">
          <div>
            <h1 className="font-display text-[52px] leading-[1.02] font-bold tracking-[-0.03em]">
              Fale inglês sem medo de errar.
            </h1>
            <p className="mt-4 max-w-md text-lg opacity-88">
              Converse com a IA sobre o que você gosta. As correções vêm só no final — e viram
              flashcards para você revisar.
            </p>
          </div>

          <div className="flex max-w-sm flex-col gap-3">
            <div className="w-fit max-w-[85%] rounded-[18px_18px_4px_18px] bg-white/16 px-4 py-3 text-[15px]">
              Yesterday I <span className="underline decoration-2 underline-offset-2">have worked</span> a
              lot on the project.
            </div>
            <div className="w-fit max-w-full rounded-card bg-surface p-4 text-ink shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-err-soft text-err">
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

        <p className="relative text-sm font-semibold opacity-90">
          1 · Converse&nbsp;&nbsp;&nbsp;2 · Entenda&nbsp;&nbsp;&nbsp;3 · Revise
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-[380px] flex-col gap-6">
          <div>
            <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sem senha. Enviamos um link de acesso para o seu e-mail.
            </p>
          </div>

          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className={status === "error" ? "border-err" : undefined}
              />
            </div>
            <Button type="submit" disabled={status === "sending"} className="h-[50px] text-[15px]">
              <Mail className="size-4" />
              {status === "sending" ? "Enviando…" : "Enviar link de acesso"}
            </Button>
            {status === "sent" && (
              <p className="text-sm text-ok">
                Link enviado para {email} — confira sua caixa de entrada.
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-err">Não foi possível enviar o link. Tente novamente.</p>
            )}
          </form>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="h-[50px] text-[15px]"
          >
            <GoogleLogo className="size-4" />
            Continuar com Google
          </Button>

          <p className="text-xs text-muted-foreground">
            Ao entrar, você concorda com os Termos e a Política de Privacidade (LGPD). Áudios de
            voz nunca são armazenados.
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.4 0-13.8 4.2-17.1 10.3z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.1 39.6 15.9 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6c-.5.4 7.2-5.3 7.2-15.2 0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
