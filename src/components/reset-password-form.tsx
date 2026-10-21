"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordRequirements } from "@/components/password-requirements";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser-client";
import { newPasswordSchema } from "@/lib/auth-validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setStatus("error");
      setErrorMessage(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setStatus("loading");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      setStatus("error");
      setErrorMessage("Não foi possível atualizar a senha. Tente pedir um novo link.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {password.length > 0 && <PasswordRequirements password={password} />}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
        <PasswordInput
          id="confirm-new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" disabled={status === "loading"} className="h-[50px] text-[15px]">
        {status === "loading" ? "Salvando…" : "Salvar nova senha"}
      </Button>
      {status === "error" && <p className="text-sm text-err">{errorMessage}</p>}
    </form>
  );
}
