import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { createServiceRoleTestClient, ensureRlsTestUser, type RlsTestUser } from "./setup";

// Integração real contra o Supabase local (não RLS em si, mas só aqui já temos
// a infra pra bater no Postgres de verdade) — valida a paginação/filtros/busca
// da Fase 3 item 8, que dependem de SQL gerado dinamicamente e não dá pra
// cobrir com os repositórios falsos dos testes unitários.

let user: RlsTestUser;

beforeAll(async () => {
  user = await ensureRlsTestUser("rls-flashcards-paging@example.com", "rls-test-password-paging");

  // Limpa cartões de execuções anteriores para a contagem ficar previsível.
  // `flashcards` não tem policy de DELETE (a app só muda status — ver seção 6
  // do CLAUDE.md), então a limpeza só é possível com a service_role.
  const service = createServiceRoleTestClient();
  const existing = await service.from("flashcards").select("id").eq("user_id", user.id);
  const existingIds = (existing.data ?? []).map((row) => row.id);
  if (existingIds.length > 0) {
    await service.from("card_schedules").delete().in("flashcard_id", existingIds);
    await service.from("flashcards").delete().in("id", existingIds);
  }

  const now = new Date();
  const seeds = [
    { front: "New card one", back: "back", status: "active", state: "new", dueOffsetMs: 0, reps: 0 },
    { front: "New card two", back: "back", status: "active", state: "new", dueOffsetMs: 0, reps: 0 },
    {
      front: "Due today",
      back: "back",
      status: "active",
      state: "review",
      dueOffsetMs: -60_000,
      reps: 3,
    },
    {
      front: "Due in the future",
      back: "back",
      status: "active",
      state: "review",
      dueOffsetMs: 7 * 24 * 60 * 60 * 1000,
      reps: 2,
    },
    {
      front: "Suspended card",
      back: "back",
      status: "suspended",
      state: "review",
      dueOffsetMs: 0,
      reps: 1,
    },
    {
      front: "Searchable banana bread recipe",
      back: "unique back text",
      status: "active",
      state: "new",
      dueOffsetMs: 0,
      reps: 0,
    },
  ];

  for (const seed of seeds) {
    const { data: flashcard } = await user.client
      .from("flashcards")
      .insert({
        user_id: user.id,
        card_type: "manual",
        front: seed.front,
        back: seed.back,
        status: seed.status,
      })
      .select()
      .single();

    await user.client.from("card_schedules").insert({
      flashcard_id: flashcard!.id,
      due_at: new Date(now.getTime() + seed.dueOffsetMs).toISOString(),
      stability: 0,
      difficulty: 0,
      reps: seed.reps,
      lapses: 0,
      state: seed.state,
    });
  }
}, 30_000);

describe("CardScheduleRepository pagination/filters/search", () => {
  it("counts each filter correctly", async () => {
    const repository = new SupabaseCardScheduleRepository(user.client);
    const counts = await repository.countByUserForEachFilter(user.id, new Date());

    expect(counts).toMatchObject({
      new: 3, // 2 "new" + the searchable one, all state=new
      // "new" and "pending" overlap by design (a new card is due immediately,
      // same as the existing listDueForUser/review queue semantics): the 3
      // new cards + "Due today" are all currently due.
      pending: 4,
      reviewed: 2, // "Due today" + "Due in the future" (reps > 0)
      suspended: 1,
      all: 6, // 5 active + 1 suspended
    });
  });

  it("filters by 'new' and paginates with a small page size", async () => {
    const repository = new SupabaseCardScheduleRepository(user.client);
    const page1 = await repository.listByUserPaged({
      userId: user.id,
      filter: "new",
      search: null,
      now: new Date(),
      page: 1,
      pageSize: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);

    const page2 = await repository.listByUserPaged({
      userId: user.id,
      filter: "new",
      search: null,
      now: new Date(),
      page: 2,
      pageSize: 2,
    });
    expect(page2.items).toHaveLength(1);
  });

  it("excludes only the flashcard due in the future from 'pending'", async () => {
    const repository = new SupabaseCardScheduleRepository(user.client);
    const result = await repository.listByUserPaged({
      userId: user.id,
      filter: "pending",
      search: null,
      now: new Date(),
      page: 1,
      pageSize: 20,
    });

    const fronts = result.items.map((item) => item.flashcard.front);
    expect(fronts).toContain("Due today");
    expect(fronts).not.toContain("Due in the future");
    expect(fronts).not.toContain("Suspended card");
  });

  it("searches by front/back text within the current filter", async () => {
    const repository = new SupabaseCardScheduleRepository(user.client);
    const result = await repository.listByUserPaged({
      userId: user.id,
      filter: "all",
      search: "banana",
      now: new Date(),
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].flashcard.front).toBe("Searchable banana bread recipe");
  });

  it("isolates flashcards per user even through the paginated query", async () => {
    const other = await ensureRlsTestUser(
      `rls-flashcards-paging-other-${randomUUID()}@example.com`,
      "rls-test-password-paging-other",
    );
    const repository = new SupabaseCardScheduleRepository(other.client);

    const result = await repository.listByUserPaged({
      userId: user.id,
      filter: "all",
      search: null,
      now: new Date(),
      page: 1,
      pageSize: 20,
    });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
