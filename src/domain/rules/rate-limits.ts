export const DEFAULT_MESSAGES_PER_MINUTE_LIMIT = 8;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

/**
 * Separado do limite diário (seção 8/11 do CLAUDE.md): protege contra rajadas
 * (script automatizado, duplo clique, retry em loop) que ficariam dentro do
 * limite diário mas gerariam custo de LLM e risco de abuso em poucos segundos.
 */
export function getMessagesPerMinuteLimit(preferences: Record<string, unknown>): number {
  const value = preferences["messagesPerMinuteLimit"];
  return typeof value === "number" && value > 0 ? value : DEFAULT_MESSAGES_PER_MINUTE_LIMIT;
}
