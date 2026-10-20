"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SaveFlashcardSuggestion } from "@/application/use-cases/save-flashcard-suggestion";
import { SaveFlashcardSuggestions } from "@/application/use-cases/save-flashcard-suggestions";
import { DiscardFlashcardSuggestion } from "@/application/use-cases/discard-flashcard-suggestion";
import { CreateManualFlashcard } from "@/application/use-cases/create-manual-flashcard";
import { ReviewFlashcard } from "@/application/use-cases/review-flashcard";
import { EditFlashcard } from "@/application/use-cases/edit-flashcard";
import { ToggleFlashcardSuspension } from "@/application/use-cases/toggle-flashcard-suspension";
import { RATINGS } from "@/domain/value-objects/rating";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseFlashcardRepository } from "@/infrastructure/supabase/flashcard-repository";
import { SupabaseReviewLogRepository } from "@/infrastructure/supabase/review-log-repository";
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
  const useCase = new SaveFlashcardSuggestion(
    new SupabaseFlashcardRepository(supabase),
    new SupabaseCardScheduleRepository(supabase),
    new TsFsrsReviewScheduler(),
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
  const saveOne = new SaveFlashcardSuggestion(
    new SupabaseFlashcardRepository(supabase),
    new SupabaseCardScheduleRepository(supabase),
    new TsFsrsReviewScheduler(),
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
  const useCase = new DiscardFlashcardSuggestion(new SupabaseFlashcardRepository(supabase));

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
  );

  await useCase.execute({ userId: user.id, ...parsed });

  redirect("/flashcards");
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
  const useCase = new EditFlashcard(new SupabaseFlashcardRepository(supabase));

  await useCase.execute({ userId: user.id, ...parsed });

  redirect("/flashcards");
}

const toggleSuspensionSchema = z.object({ flashcardId: z.string().uuid() });

export async function toggleFlashcardSuspensionAction(formData: FormData) {
  const parsed = toggleSuspensionSchema.parse({ flashcardId: formData.get("flashcardId") });

  const { supabase, user } = await requireUser();
  const useCase = new ToggleFlashcardSuspension(new SupabaseFlashcardRepository(supabase));

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
  );

  await useCase.execute({ flashcardId: parsed.flashcardId, userId: user.id, rating: parsed.rating });

  revalidatePath("/review");
}
