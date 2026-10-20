export interface RateLimitRepository {
  /** Mensagens do usuário (role 'user') criadas desde `since`, em qualquer conversa. */
  countRecentUserMessages(userId: string, since: Date): Promise<number>;
}
