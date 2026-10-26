"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { History, PartyPopper, Speech, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { reviewFlashcardAction } from "@/app/flashcards/actions";
import { buildCardTypeLabels } from "@/lib/card-type-labels";
import type { Rating } from "@/domain/value-objects/rating";
import type { CardType } from "@/domain/value-objects/card-type";

const RATING_CLASSNAMES: Record<Rating, string> = {
  again: "bg-err-soft text-err",
  hard: "bg-sug-soft text-sug-ink",
  good: "bg-acc-soft text-acc-strong",
  easy: "bg-ok-soft text-ok",
};

const RATING_ORDER: Rating[] = ["again", "hard", "good", "easy"];
const XP_PER_REVIEW = 1;
const XP_DAILY_REVIEWS_COMPLETED = 10;

type Translator = ReturnType<typeof useTranslations>;

function formatInterval(t: Translator, days: number): string {
  if (days < 1 / 24) return t("intervalMinutes", { minutes: Math.max(1, Math.round(days * 24 * 60)) });
  if (days < 1) return t("intervalHours", { hours: Math.round(days * 24) });
  return t("intervalDays", { days: Math.round(days) });
}

export interface ReviewQueueItem {
  flashcardId: string;
  cardType: CardType;
  front: string;
  back: string;
  explanation: string | null;
  learningPointTag: { label: string; occurrenceCount: number } | null;
  previews: Record<Rating, number>;
}

export function ReviewSession({ items, streak }: { items: ReviewQueueItem[]; streak: number }) {
  const t = useTranslations("review");
  const tCardType = useTranslations("cardType");
  const cardTypeLabels = buildCardTypeLabels(tCardType);
  const [queue] = useState(items);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const current = queue[index];
  const finished = !current;

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!current || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await reviewFlashcardAction({ flashcardId: current.flashcardId, rating });
        setReviewedCount((count) => count + 1);
        setIndex((previous) => previous + 1);
        setRevealed(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [current, isSubmitting],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (finished || isSubmitting) return;
      if (!revealed && event.code === "Space") {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed) {
        const rating = { Digit1: "again", Digit2: "hard", Digit3: "good", Digit4: "easy" }[
          event.code
        ] as Rating | undefined;
        if (rating) void handleRate(rating);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, finished, isSubmitting, handleRate]);

  if (finished) {
    const xpGained =
      reviewedCount * XP_PER_REVIEW + (reviewedCount > 0 ? XP_DAILY_REVIEWS_COMPLETED : 0);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-acc-soft">
          <PartyPopper className="size-10 text-acc-strong" />
        </span>
        <h1 className="font-display text-2xl font-bold">
          {reviewedCount > 0 ? t("sessionDoneTitle") : t("nothingToReviewTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {reviewedCount > 0 ? t("sessionDoneMessage") : t("nothingToReviewMessage")}
        </p>
        {reviewedCount > 0 && (
          <div className="mt-1 flex gap-2">
            <span className="rounded-full bg-xp/15 px-3 py-1 text-sm font-bold text-xp">
              {t("xpGained", { xp: xpGained })}
            </span>
            <span className="rounded-full bg-fire/15 px-3 py-1 text-sm font-bold text-fire">
              {t("streakDays", { count: streak })}
            </span>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <Link
            href="/review"
            className="flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-bold hover:border-acc"
          >
            {t("reviewAgain")}
          </Link>
          <Link
            href="/conversations/new"
            className="flex h-11 items-center justify-center rounded-full bg-acc px-5 text-sm font-bold text-acc-ink"
          >
            {t("applyInConversation")}
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((index / queue.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label={t("closeReview")}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface2"
        >
          <X className="size-4" />
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
          <div className="h-full bg-acc transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {t("progressCount", { current: index + 1, total: queue.length })}
        </span>
      </header>

      <div className="flex min-h-[340px] flex-col rounded-[28px] border border-line bg-surface p-10 shadow-card">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-acc-soft px-3 py-1 text-xs font-bold tracking-[.04em] text-acc-strong uppercase">
            {cardTypeLabels[current.cardType]}
          </span>
          {current.learningPointTag && (
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <History className="size-3.5" />
              {current.learningPointTag.label} · {current.learningPointTag.occurrenceCount}×
            </span>
          )}
        </div>

        <p className="mt-6 font-display text-[30px] leading-[1.25] font-bold">{current.front}</p>

        {revealed && (
          <>
            <hr className="my-6 border-line" />
            <p className="font-display text-[26px] font-bold text-acc-strong">{current.back}</p>
            {current.explanation && (
              <p className="mt-2 text-[15px] text-muted-foreground">{current.explanation}</p>
            )}
          </>
        )}

        {!revealed && (
          <div className="mt-auto flex flex-col items-center gap-4 pt-8 text-center">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Speech className="size-4" />
              {t("tryAnswerAloud")}
            </p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="flex h-[54px] w-full max-w-xs items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink"
            >
              {t("showAnswer")}
            </button>
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATING_ORDER.map((rating, i) => (
            <button
              key={rating}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(rating)}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-control font-bold disabled:opacity-50 ${RATING_CLASSNAMES[rating]}`}
            >
              <span className="text-[15px]">{t(`ratings.${rating}`)}</span>
              <span className="text-xs font-semibold opacity-80">
                {formatInterval(t, current.previews[rating])} · {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
