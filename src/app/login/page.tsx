"use client";

import { useState, type FormEvent } from "react";
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
    <main className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Entrar no English Quest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receba um link de acesso por e-mail ou entre com sua conta Google.
        </p>
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
        />
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Enviando..." : "Enviar link de acesso"}
        </Button>
        {status === "sent" && (
          <p className="text-sm text-green-600">
            Link enviado! Confira seu e-mail para continuar.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">
            Não foi possível enviar o link. Tente novamente.
          </p>
        )}
      </form>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" onClick={handleGoogleLogin}>
        Continuar com Google
      </Button>
    </main>
  );
}
