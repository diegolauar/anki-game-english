import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { signInViaMagicLink } from "./helpers";

const TEST_EMAIL = "e2e-review@example.com";

async function seedDueFlashcard(): Promise<{ front: string; back: string }> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: existingUsers } = await client.auth.admin.listUsers();
  let user = existingUsers.users.find((candidate) => candidate.email === TEST_EMAIL);

  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    // Limpa flashcards deixados por execuções anteriores deste teste, para que
    // a fila de revisão tenha sempre exatamente um cartão pendente.
    const { data: previousFlashcards } = await client
      .from("flashcards")
      .select("id")
      .eq("user_id", user.id);
    const previousIds = (previousFlashcards ?? []).map((row) => row.id);
    if (previousIds.length > 0) {
      // review_logs é append-only (trigger bloqueia DELETE até para o service
      // role) e não afeta a fila de pendentes, então só limpamos schedule e cartão.
      await client.from("card_schedules").delete().in("flashcard_id", previousIds);
      await client.from("flashcards").delete().in("id", previousIds);
    }
  }

  const front = `E2E front ${Date.now()}`;
  const back = `E2E back ${Date.now()}`;

  const { data: flashcard, error: flashcardError } = await client
    .from("flashcards")
    .insert({
      user_id: user.id,
      card_type: "manual",
      front,
      back,
      status: "active",
    })
    .select()
    .single();
  if (flashcardError) throw flashcardError;

  const { error: scheduleError } = await client.from("card_schedules").insert({
    flashcard_id: flashcard.id,
    due_at: new Date(Date.now() - 60_000).toISOString(),
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: "new",
  });
  if (scheduleError) throw scheduleError;

  return { front, back };
}

test("review a due flashcard end to end and see XP update on the dashboard", async ({ page }) => {
  const { front, back } = await seedDueFlashcard();

  await signInViaMagicLink(page, TEST_EMAIL);

  await page.goto("/review");
  await expect(page.getByText(front)).toBeVisible();

  await page.getByRole("button", { name: "Mostrar resposta" }).click();
  await expect(page.getByText(back)).toBeVisible();

  await page.getByRole("button", { name: "Bom" }).click();
  await expect(page.getByText("Revisão do dia concluída!")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/\d+ XP/).first()).toBeVisible();
});
