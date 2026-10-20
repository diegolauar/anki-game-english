"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2500;

/** Refaz o fetch da página (Server Component) periodicamente enquanto a
 * análise estiver pending/processing, já que ela agora roda depois da
 * resposta HTTP (ver conversations/actions.ts) em vez de bloquear o redirect. */
export function ResultsPolling() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  return null;
}
