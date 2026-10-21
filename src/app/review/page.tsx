import { ReviewSession, type ReviewQueueItem } from "@/components/review-session";
import { calculateStreak } from "@/domain/rules/calculate-streak";
import type { Rating } from "@/domain/value-objects/rating";
import { RATINGS } from "@/domain/value-objects/rating";
import { requireUser } from "@/infrastructure/supabase/require-user";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";
import { SupabaseLearningPointRepository } from "@/infrastructure/supabase/learning-point-repository";
import { SupabaseXpEventRepository } from "@/infrastructure/supabase/xp-event-repository";
import { TsFsrsReviewScheduler } from "@/infrastructure/scheduler/ts-fsrs-review-scheduler";

export default async function ReviewPage() {
  const { supabase, user } = await requireUser();

  const now = new Date();
  const dueFlashcards = await new SupabaseCardScheduleRepository(supabase).listDueForUser(
    user.id,
    now,
  );

  const learningPointIds = [
    ...new Set(
      dueFlashcards
        .map((due) => due.flashcard.learningPointId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const learningPoints = await new SupabaseLearningPointRepository(supabase).listByIds(
    learningPointIds,
  );
  const learningPointById = new Map(learningPoints.map((point) => [point.id, point]));

  const scheduler = new TsFsrsReviewScheduler();
  const items: ReviewQueueItem[] = dueFlashcards.map(({ flashcard, schedule }) => {
    const learningPoint = flashcard.learningPointId
      ? learningPointById.get(flashcard.learningPointId)
      : undefined;

    const previews = Object.fromEntries(
      RATINGS.map((rating) => [rating, scheduler.review(schedule, rating, now).scheduledDays]),
    ) as Record<Rating, number>;

    return {
      flashcardId: flashcard.id,
      cardType: flashcard.cardType,
      front: flashcard.front,
      back: flashcard.back,
      explanation: flashcard.explanation,
      learningPointTag: learningPoint
        ? {
            label: learningPoint.ruleKey.replaceAll("_", " "),
            occurrenceCount: learningPoint.occurrenceCount,
          }
        : null,
      previews,
    };
  });

  const activeDateKeys = await new SupabaseXpEventRepository(supabase).listActiveDateKeysByUser(
    user.id,
  );
  const streak = calculateStreak(activeDateKeys, now);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-1 flex-col">
      <ReviewSession items={items} streak={streak} />
    </main>
  );
}
