import { defineConfig } from "vitest/config";
import path from "node:path";

// Config separada de vitest.config.mts: estes testes batem no Supabase local de
// verdade (precisa do Docker rodando via `supabase start`) para confirmar que as
// RLS policies das migrações realmente passam/falham como o esperado por papel
// (anon, authenticated de cada usuário, service_role) — não dá pra testar isso
// com os repositórios falsos usados em tests/**/*.test.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    passWithNoTests: true,
    // Policies que dependem de triggers/constraints no Postgres podem ser lentas
    // sob carga local; generoso para evitar flakiness no CI.
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
