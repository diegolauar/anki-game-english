function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Streak = dias consecutivos com xp_events (CLAUDE.md seção 4). Se hoje ainda não
 * tiver nenhum evento, o dia não é considerado quebrado (ainda não acabou) — a
 * contagem simplesmente começa a partir de ontem.
 */
export function calculateStreak(activeDateKeys: string[], today: Date): number {
  const dateSet = new Set(activeDateKeys);
  const cursor = new Date(today);

  if (!dateSet.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
