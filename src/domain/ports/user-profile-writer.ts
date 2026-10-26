/**
 * `user_profiles` tem policy de RLS de UPDATE para o próprio usuário (ver migração
 * inicial) — diferente de `xp_events`/`subscriptions`, esta escrita NÃO exige
 * service_role; o adaptador usa o client de sessão normal.
 */
export interface UserProfileWriter {
  /**
   * Lê `preferences`, mescla as chaves do patch e grava de volta. Aceitável como
   * read-merge-write porque é o próprio usuário autenticado escrevendo a própria
   * linha, com baixa frequência e baixo risco de concorrência.
   */
  updatePreferences(userId: string, patch: Record<string, unknown>): Promise<void>;
}
