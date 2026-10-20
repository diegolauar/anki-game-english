import type { CardType } from "@/domain/value-objects/card-type";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";

export interface Flashcard {
  id: string;
  userId: string;
  learningPointId: string | null;
  sourceFindingId: string | null;
  cardType: CardType;
  front: string;
  back: string;
  explanation: string | null;
  status: FlashcardStatus;
  createdAt: string;
  updatedAt: string;
}
