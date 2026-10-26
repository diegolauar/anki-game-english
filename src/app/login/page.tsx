"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordRequirements } from "@/components/password-requirements";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { signInSchema, signUpSchema } from "@/lib/auth-validation";

type AuthTab = "signin" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<AuthTab>("signin");

  return (
    <main className="grid min-h-dvh flex-1 grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <h1 className="sr-only md:hidden">Fluency Mind — Entrar ou criar conta</h1>

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
            <span className="font-display text-lg font-extrabold">F</span>
          </span>
          <span className="font-display text-lg font-bold">Fluency Mind</span>
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

      <section className="flex flex-1 justify-center overflow-y-auto p-8 pt-16 sm:pt-20">
        <div className="flex h-fit w-full max-w-[380px] flex-col gap-6">
          <div>
            <div
              role="tablist"
              aria-label="Entrar ou criar conta"
              className="flex h-14 items-center gap-1 rounded-full border border-line bg-surface2 p-1.5"
            >
              <button
                type="button"
                role="tab"
                id="signin-tab"
                aria-selected={tab === "signin"}
                aria-controls="signin-panel"
                onClick={() => setTab("signin")}
                className={`h-full flex-1 rounded-full text-[15px] font-bold transition-colors duration-150 ${
                  tab === "signin"
                    ? "bg-acc text-acc-ink shadow-[0_4px_14px_-4px_var(--acc)]"
                    : "text-muted-foreground hover:bg-surface hover:text-ink"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                id="signup-tab"
                aria-selected={tab === "signup"}
                aria-controls="signup-panel"
                onClick={() => setTab("signup")}
                className={`h-full flex-1 rounded-full text-[15px] font-bold transition-colors duration-150 ${
                  tab === "signup"
                    ? "bg-acc text-acc-ink shadow-[0_4px_14px_-4px_var(--acc)]"
                    : "text-muted-foreground hover:bg-surface hover:text-ink"
                }`}
              >
                Criar conta
              </button>
            </div>

            <div
              key={tab}
              role="tabpanel"
              id={`${tab}-panel`}
              aria-labelledby={`${tab}-tab`}
              className="mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
            >
              {tab === "signin" ? <SignInPanel /> : <SignUpPanel />}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Ao continuar, você concorda com os Termos e a Política de Privacidade (LGPD). Áudios
            de voz nunca são armazenados.
          </p>
        </div>
      </section>
    </main>
  );
}

function SignInPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic-link">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [magicEmail, setMagicEmail] = useState("");
  const [magicStatus, setMagicStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      setStatus("error");
      setErrorMessage("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMagicStatus("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setMagicStatus(error ? "error" : "sent");
  }

  async function handleGoogleLogin() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (mode === "magic-link") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sem senha. Enviamos um link de acesso para o seu e-mail.
          </p>
        </div>

        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="magic-email">E-mail</Label>
            <Input
              id="magic-email"
              type="email"
              required
              value={magicEmail}
              onChange={(event) => setMagicEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              className={magicStatus === "error" ? "border-err" : undefined}
            />
          </div>
          <Button type="submit" disabled={magicStatus === "sending"} className="h-[50px] text-[15px]">
            <Mail className="size-4" />
            {magicStatus === "sending" ? "Enviando…" : "Enviar link de acesso"}
          </Button>
          {magicStatus === "sent" && (
            <p className="text-sm text-ok">
              Link enviado para {magicEmail} — confira sua caixa de entrada.
            </p>
          )}
          {magicStatus === "error" && (
            <p className="text-sm text-err">Não foi possível enviar o link. Tente novamente.</p>
          )}
        </form>

        <button
          type="button"
          onClick={() => setMode("password")}
          className="text-left text-sm font-semibold text-acc-strong hover:underline"
        >
          Entrar com e-mail e senha
        </button>

        <GoogleDivider />
        <GoogleButton onClick={handleGoogleLogin} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">Entrar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Acesse com seu e-mail e senha.</p>
      </div>

      <form onSubmit={handlePasswordSignIn} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signin-email">E-mail</Label>
          <Input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Senha</Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-acc-strong hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <PasswordInput
            id="signin-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={status === "loading"} className="h-[50px] text-[15px]">
          {status === "loading" ? "Entrando…" : "Entrar"}
        </Button>
        {status === "error" && <p className="text-sm text-err">{errorMessage}</p>}
      </form>

      <button
        type="button"
        onClick={() => setMode("magic-link")}
        className="text-left text-sm font-semibold text-acc-strong hover:underline"
      >
        Prefere entrar sem senha? Receba um link por e-mail
      </button>

      <GoogleDivider />
      <GoogleButton onClick={handleGoogleLogin} />
    </div>
  );
}

function SignUpPanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = signUpSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.status === 429
          ? "Muitas tentativas. Aguarde um pouco e tente de novo."
          : "Não foi possível criar sua conta. Tente novamente.",
      );
      return;
    }

    // Mesma mensagem independente de o e-mail já existir ou não (evita
    // confirmar pra quem está testando se um e-mail já tem conta).
    setStatus("sent");
  }

  async function handleGoogleSignUp() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">Quase lá</h2>
        <p className="text-sm text-muted-foreground">
          Se {email} ainda não tiver uma conta, enviamos um link de confirmação pra esse endereço
          — confira sua caixa de entrada pra ativar o acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[32px] font-bold tracking-[-0.02em]">Criar conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nome, e-mail e senha — só isso.</p>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-name">Nome</Label>
          <Input
            id="signup-name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-email">E-mail</Label>
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-password">Senha</Label>
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          {password.length > 0 && <PasswordRequirements password={password} />}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-confirm-password">Confirmar senha</Label>
          <PasswordInput
            id="signup-confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={status === "loading"} className="h-[50px] text-[15px]">
          {status === "loading" ? "Criando conta…" : "Criar conta"}
        </Button>
        {status === "error" && <p className="text-sm text-err">{errorMessage}</p>}
      </form>

      <GoogleDivider />
      <GoogleButton onClick={handleGoogleSignUp} label="Continuar com Google" />
    </div>
  );
}

function GoogleDivider() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-line" />
      ou
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function GoogleButton({ onClick, label = "Continuar com Google" }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-[50px] text-[15px]">
      <GoogleLogo className="size-4" />
      {label}
    </Button>
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
