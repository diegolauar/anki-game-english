/**
 * Chave do localStorage com a escolha de tema do usuário ("light" | "dark").
 * Mantida em sincronia manualmente com o script inline em app/layout.tsx
 * (que não pode importar este módulo — roda antes da hidratação, direto no HTML).
 */
export const THEME_STORAGE_KEY = "theme";
