import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating as FsrsRating,
  State as FsrsState,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { ReviewOutcome, ReviewScheduler } from "@/domain/ports/review-scheduler";
import type { CardState } from "@/domain/value-objects/card-state";
import type { Rating } from "@/domain/value-objects/rating";

const STATE_TO_DOMAIN: Record<FsrsState, CardState> = {
  [FsrsState.New]: "new",
  [FsrsState.Learning]: "learning",
  [FsrsState.Review]: "review",
  [FsrsState.Relearning]: "relearning",
};

const STATE_TO_FSRS: Record<CardState, FsrsState> = {
  new: FsrsState.New,
  learning: FsrsState.Learning,
  review: FsrsState.Review,
  relearning: FsrsState.Relearning,
};

const RATING_TO_FSRS: Record<Rating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

function toCard(snapshot: ScheduleSnapshot): Card {
  return {
    due: new Date(snapshot.dueAt),
    stability: snapshot.stability,
    difficulty: snapshot.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: snapshot.reps,
    lapses: snapshot.lapses,
    learning_steps: 0,
    state: STATE_TO_FSRS[snapshot.state],
    last_review: snapshot.lastReviewedAt ? new Date(snapshot.lastReviewedAt) : undefined,
  };
}

function toSnapshot(card: Card): ScheduleSnapshot {
  return {
    dueAt: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_TO_DOMAIN[card.state],
    lastReviewedAt: card.last_review ? card.last_review.toISOString() : null,
  };
}

/**
 * enable_short_term: false faz o FSRS ir direto para o estado "review" em toda
 * revisão (sem os sub-passos de curto prazo em minutos/horas). O schema do
 * CLAUDE.md (card_schedules) não tem coluna para `learning_steps`, então essa
 * configuração evita perder precisão do algoritmo ao persistir o estado.
 */
export class TsFsrsReviewScheduler implements ReviewScheduler {
  private readonly scheduler = fsrs(generatorParameters({ enable_short_term: false }));

  initialState(now: Date): ScheduleSnapshot {
    return toSnapshot(createEmptyCard(now));
  }

  review(current: ScheduleSnapshot, rating: Rating, now: Date): ReviewOutcome {
    const { card, log } = this.scheduler.next(toCard(current), now, RATING_TO_FSRS[rating]);

    return {
      schedule: toSnapshot(card),
      elapsedDays: log.elapsed_days,
      scheduledDays: log.scheduled_days,
    };
  }
}
