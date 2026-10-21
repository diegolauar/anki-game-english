"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SaveFlashcardSuggestion } from "@/application/use-cases/save-flashcard-suggestion";
import { SaveFlashcardSuggestions } from "@/application/use-cases/save-flashcard-suggestions";
import { DiscardFlashcardSuggestion } from "@/application/use-cases/discard-flashcard-suggestion";
import { CreateManualFlashcard } from "@/application/use-cases/create-manual-flashcard";
import { ImportFlashcards } from "@/application/use-cases/import-flashcards";
import { ReviewFlashcard } from "@/application/use-cases/review-flashcard";
import { EditFlashcard } from "@/application/use-cases/edit-flashcard";
import { ToggleFlashcardSuspension } from "@/application/use-cases/toggle-flashcard-suspension";
import { parseFlashcardCsv } from "@/domain/rules/parse-flashcard-csv";
import { RATINGS } from "@/domain/value-objects/rating";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseReviewLogRepository } from "@/infrastructure/supabase/review-log-repository";
import { SupabaseXpEventWriter } from "@/infrastructure/supabase/xp-event-writer";
import { TsFsrsReviewScheduler } from "@/infrastructure/scheduler/ts-fsrs-review-scheduler";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

const saveSuggestionSchema = z.object({
  flashcardId: z.string().uuid(),
  front: z.string().trim().min(1).optional(),
  back: z.string().trim().min(1).optional(),
  explanation: z.string().trim().nullable().optional(),
  resultsPath: z.string().min(1),
});

export async function saveFlashcardSuggestionAction(formData: FormData) {
  const rawExplanation = formData.get("explanation");
  const parsed = saveSuggestionSchema.parse({
    flashcardId: formData.get("flashcardId"),
    front: formData.get("front") || undefined,
    back: formData.get("back") || undefined,
    explanation: typeof rawExplanation === "string" ? rawExplanation : undefined,
    resultsPath: formData.get("resultsPath"),
  });

  const { supabase, user } = await requireUser();
  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const useCase = new SaveFlashcardSuggestion(
    flashcardRepository,
    flashcardRepository,
    new SupabaseCardScheduleRepository(supabase),
    new TsFsrsReviewScheduler(),
    new SupabaseXpEventWriter(createSupabaseServiceRoleClient()),
  );

  await useCase.execute({
    flashcardId: parsed.flashcardId,
    userId: user.id,
    front: parsed.front,
    back: parsed.back,
    explanation: parsed.explanation,
  });

  revalidatePath(parsed.resultsPath);
}

const saveAllSuggestionsSchema = z.object({
  flashcardIds: z.array(z.string().uuid()),
  resultsPath: z.string().min(1),
});

export async function saveAllFlashcardSuggestionsAction(formData: FormData) {
  const parsed = saveAllSuggestionsSchema.parse({
    flashcardIds: formData.getAll("flashcardIds"),
    resultsPath: formData.get("resultsPath"),
  });

  const { supabase, user } = await requireUser();
  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const saveOne = new SaveFlashcardSuggestion(
    flashcardRepository,
    flashcardRepository,
    new SupabaseCardScheduleRepository(supabase),
    new TsFsrsReviewScheduler(),
    new SupabaseXpEventWriter(createSupabaseServiceRoleClient()),
  );
  const useCase = new SaveFlashcardSuggestions(saveOne);

  await useCase.execute({ flashcardIds: parsed.flashcardIds, userId: user.id });

  revalidatePath(parsed.resultsPath);
}

const discardSuggestionSchema = z.object({
  flashcardId: z.string().uuid(),
  resultsPath: z.string().min(1),
});

export async function discardFlashcardSuggestionAction(formData: FormData) {
  const parsed = discardSuggestionSchema.parse({
    flashcardId: formData.get("flashcardId"),
    resultsPath: formData.get("resultsPath"),
  });

  const { supabase, user } = await requireUser();
  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const useCase = new DiscardFlashcardSuggestion(flashcardRepository, flashcardRepository);

  await useCase.execute({ flashcardId: parsed.flashcardId, userId: user.id });

  revalidatePath(parsed.resultsPath);
}

const createManualFlashcardSchema = z.object({
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
  explanation: z.string().trim().min(1).nullable(),
});

export async function createManualFlashcardAction(formData: FormData) {
  const rawExplanation = formData.get("explanation");
  const parsed = createManualFlashcardSchema.parse({
    front: formData.get("front"),
    back: formData.get("back"),
    explanation:
      typeof rawExplanation === "string" && rawExplanation.trim().length > 0
        ? rawExplanation
        : null,
  });

  const { supabase, user } = await requireUser();
  const useCase = new CreateManualFlashcard(
    new SupabaseFlashcardRepository(supabase),
    new SupabaseCardScheduleRepository(supabase),
    new TsFsrsReviewScheduler(),
    new SupabaseXpEventWriter(createSupabaseServiceRoleClient()),
  );

  await useCase.execute({ userId: user.id, ...parsed });

  redirect("/flashcards");
}

const MAX_FLASHCARD_IMPORT_FILE_SIZE_BYTES = 256 * 1024;

export async function importFlashcardsAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/flashcards/import?error=${encodeURIComponent("Selecione um arquivo .csv para importar.")}`);
  }
  if (file.size > MAX_FLASHCARD_IMPORT_FILE_SIZE_BYTES) {
    redirect(`/flashcards/import?error=${encodeURIComponent("O arquivo não pode passar de 256 KB.")}`);
  }

  const content = await file.text();
  const { rows, errors } = parseFlashcardCsv(content);

  if (rows.length === 0) {
    const message = errors[0]?.message ?? "Nenhum cartão válido encontrado no arquivo.";
    redirect(`/flashcards/import?error=${encodeURIComponent(message)}`);
  }

  const useCase = new ImportFlashcards(
    new CreateManualFlashcard(
      new SupabaseFlashcardRepository(supabase),
      new SupabaseCardScheduleRepository(supabase),
      new TsFsrsReviewScheduler(),
      new SupabaseXpEventWriter(createSupabaseServiceRoleClient()),
    ),
  );

  const result = await useCase.execute({ userId: user.id, rows });
  const skipped = errors.length + result.failed.length;

  redirect(`/flashcards/import?created=${result.created.length}&skipped=${skipped}`);
}

const editFlashcardSchema = z.object({
  flashcardId: z.string().uuid(),
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
  explanation: z.string().trim().nullable(),
});

export async function editFlashcardAction(formData: FormData) {
  const rawExplanation = formData.get("explanation");
  const parsed = editFlashcardSchema.parse({
    flashcardId: formData.get("flashcardId"),
    front: formData.get("front"),
    back: formData.get("back"),
    explanation:
      typeof rawExplanation === "string" && rawExplanation.trim().length > 0
        ? rawExplanation
        : null,
  });

  const { supabase, user } = await requireUser();
  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const useCase = new EditFlashcard(flashcardRepository, flashcardRepository);

  await useCase.execute({ userId: user.id, ...parsed });

  redirect("/flashcards");
}

const toggleSuspensionSchema = z.object({ flashcardId: z.string().uuid() });

export async function toggleFlashcardSuspensionAction(formData: FormData) {
  const parsed = toggleSuspensionSchema.parse({ flashcardId: formData.get("flashcardId") });

  const { supabase, user } = await requireUser();
  const flashcardRepository = new SupabaseFlashcardRepository(supabase);
  const useCase = new ToggleFlashcardSuspension(flashcardRepository, flashcardRepository);

  await useCase.execute({ flashcardId: parsed.flashcardId, userId: user.id });

  revalidatePath("/flashcards");
}

const reviewFlashcardSchema = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(RATINGS),
});

export async function reviewFlashcardAction(input: { flashcardId: string; rating: string }) {
  const parsed = reviewFlashcardSchema.parse(input);

  const { supabase, user } = await requireUser();
  const useCase = new ReviewFlashcard(
    new SupabaseFlashcardRepository(supabase),
    new SupabaseCardScheduleRepository(supabase),
    new SupabaseReviewLogRepository(supabase),
    new TsFsrsReviewScheduler(),
    new SupabaseXpEventWriter(createSupabaseServiceRoleClient()),
  );

  await useCase.execute({ flashcardId: parsed.flashcardId, userId: user.id, rating: parsed.rating });

  revalidatePath("/review");
}
