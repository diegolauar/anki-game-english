/**
 * Logging estruturado para os `catch` intencionais que não derrubam o fluxo
 * (ex.: falha ao registrar uso de LLM, falha de transcrição, análise que caiu
 * em `failed`). Sem serviço externo: escreve uma linha JSON em
 * console.error/warn, que qualquer agregador de log (Vercel, etc.) já coleta
 * — dá pra trocar por um provedor de error tracking depois sem mudar os
 * call sites, só a implementação daqui.
 */

type LogContext = Record<string, string | number | boolean | null | undefined>;

function serializeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error) };
}

export function logError(event: string, context: LogContext = {}, error?: unknown): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      ...context,
      ...(error !== undefined ? { error: serializeError(error) } : {}),
    }),
  );
}

export function logWarn(event: string, context: LogContext = {}): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      event,
      timestamp: new Date().toISOString(),
      ...context,
    }),
  );
}
