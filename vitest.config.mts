import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // tests/rls precisa do Supabase local rodando e de variáveis de ambiente
    // (SUPABASE_SERVICE_ROLE_KEY etc.) — tem config e script próprios (test:rls),
    // para `npm test` continuar rápido e sem dependências externas.
    exclude: ["tests/rls/**", "node_modules/**"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
