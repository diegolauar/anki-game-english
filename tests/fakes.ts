import type { Analysis } from "@/domain/entities/analysis";
import type { CardSchedule, ScheduleSnapshot } from "@/domain/entities/card-schedule";
import type { Conversation } from "@/domain/entities/conversation";
import type { Finding } from "@/domain/entities/finding";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { LearningPoint } from "@/domain/entities/learning-point";
import type { Message } from "@/domain/entities/message";
import type { ReviewLog } from "@/domain/entities/review-log";
import type { SpeechTranscription } from "@/domain/entities/speech-transcription";
import type { Topic } from "@/domain/entities/topic";
import type { UserProfile } from "@/domain/entities/user-profile";
import type { XpEvent } from "@/domain/entities/xp-event";
import type {
  AnalysisAgent,
  AnalysisAgentInput,
  AnalysisAgentResult,
} from "@/domain/ports/analysis-agent";
import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { AnalysisWriter, MarkAnalysisCompletedInput } from "@/domain/ports/analysis-writer";
import type { CardScheduleRepository, DueFlashcard } from "@/domain/ports/card-schedule-repository";
import type { ConversationAgent, ConversationReplyInput } from "@/domain/ports/conversation-agent";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "@/domain/ports/conversation-repository";
import type { FindingRepository } from "@/domain/ports/finding-repository";
import type { CreateFindingInput, FindingWriter } from "@/domain/ports/finding-writer";
import type {
  CreateManualFlashcardInput,
  CreateSuggestedFlashcardInput,
  FlashcardContentUpdate,
  FlashcardRepository,
} from "@/domain/ports/flashcard-repository";
import type { LearningPointRepository } from "@/domain/ports/learning-point-repository";
import type {
  CreateLearningPointInput,
  LearningPointWriter,
} from "@/domain/ports/learning-point-writer";
import type { CreateMessageInput, MessageRepository } from "@/domain/ports/message-repository";
import type { CreateReviewLogInput, ReviewLogRepository } from "@/domain/ports/review-log-repository";
import type { ReviewOutcome, ReviewScheduler } from "@/domain/ports/review-scheduler";
import type {
  CreateSpeechTranscriptionInput,
  SpeechTranscriptionRepository,
} from "@/domain/ports/speech-transcription-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { UserProfileRepository } from "@/domain/ports/user-profile-repository";
import type { DailyXpTotal, XpEventRepository } from "@/domain/ports/xp-event-repository";
import type { CreateXpEventInput, XpEventWriter } from "@/domain/ports/xp-event-writer";
import type { DailyUsage, DailyUsageRepository } from "@/domain/ports/daily-usage-repository";
import type { FlashcardStatus } from "@/domain/value-objects/flashcard-status";
import type { Rating } from "@/domain/value-objects/rating";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class FakeConversationRepository implements ConversationRepository {
  conversations = new Map<string, Conversation>();

  async create(input: CreateConversationInput): Promise<Conversation> {
    const conversation: Conversation = {
      id: nextId("conversation"),
      userId: input.userId,
      topicId: input.topicId,
      customTopic: input.customTopic,
      difficulty: input.difficulty,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) ?? null;
  }

  async finish(id: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (!conversation) return;
    this.conversations.set(id, {
      ...conversation,
      status: "finished",
      endedAt: new Date().toISOString(),
    });
  }

  async listRecentByUser(userId: string, limit: number): Promise<Conversation[]> {
    return [...this.conversations.values()]
      .filter((conversation) => conversation.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  seed(conversation: Conversation) {
    this.conversations.set(conversation.id, conversation);
  }
}

export class FakeMessageRepository implements MessageRepository {
  messages: Message[] = [];

  async listByConversation(conversationId: string): Promise<Message[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async findByClientMessageId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null> {
    return (
      this.messages.find(
        (message) =>
          message.conversationId === conversationId &&
          message.clientMessageId === clientMessageId,
      ) ?? null
    );
  }

  async create(input: CreateMessageInput): Promise<Message> {
    const existingForConversation = this.messages.filter(
      (message) => message.conversationId === input.conversationId,
    );
    const sequence = existingForConversation.length
      ? Math.max(...existingForConversation.map((message) => message.sequence)) + 1
      : 1;

    const message: Message = {
      id: nextId("message"),
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      inputMode: input.inputMode,
      sequence,
      clientMessageId: input.clientMessageId,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(message);
    return message;
  }

  async countByConversation(conversationId: string): Promise<number> {
    return this.messages.filter((message) => message.conversationId === conversationId).length;
  }

  seed(message: Message) {
    this.messages.push(message);
  }
}

export class FakeTopicRepository implements TopicRepository {
  topics: Topic[] = [];

  async listActive(): Promise<Topic[]> {
    return this.topics;
  }

  async findById(id: string): Promise<Topic | null> {
    return this.topics.find((topic) => topic.id === id) ?? null;
  }
}

export class FakeUserProfileRepository implements UserProfileRepository {
  profiles = new Map<string, UserProfile>();

  async getById(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  seed(profile: UserProfile) {
    this.profiles.set(profile.id, profile);
  }
}

export class FakeXpEventRepository implements XpEventRepository, XpEventWriter {
  events: XpEvent[] = [];

  async create(input: CreateXpEventInput): Promise<XpEvent | null> {
    const alreadyExists = this.events.some(
      (event) => event.userId === input.userId && event.sourceType === input.sourceType && event.sourceId === input.sourceId,
    );
    if (alreadyExists) return null;

    const event: XpEvent = {
      id: nextId("xp-event"),
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async sumByUser(userId: string): Promise<number> {
    return this.events
      .filter((event) => event.userId === userId)
      .reduce((sum, event) => sum + event.amount, 0);
  }

  async listActiveDateKeysByUser(userId: string): Promise<string[]> {
    const dateKeys = new Set(
      this.events
        .filter((event) => event.userId === userId)
        .map((event) => event.createdAt.slice(0, 10)),
    );
    return [...dateKeys];
  }

  async listDailyTotalsByUser(userId: string, since: Date): Promise<DailyXpTotal[]> {
    const totals = new Map<string, number>();
    for (const event of this.events) {
      if (event.userId !== userId) continue;
      if (new Date(event.createdAt).getTime() < since.getTime()) continue;
      const dateKey = event.createdAt.slice(0, 10);
      totals.set(dateKey, (totals.get(dateKey) ?? 0) + event.amount);
    }
    return [...totals.entries()].map(([dateKey, amount]) => ({ dateKey, amount }));
  }
}

export class FakeDailyUsageRepository implements DailyUsageRepository {
  usage: DailyUsage = { messageCount: 0, voiceMinutes: 0 };

  async getTodayUsage(): Promise<DailyUsage> {
    return this.usage;
  }
}

export class FakeSpeechTranscriptionRepository implements SpeechTranscriptionRepository {
  transcriptions: SpeechTranscription[] = [];

  async create(input: CreateSpeechTranscriptionInput): Promise<SpeechTranscription> {
    const transcription: SpeechTranscription = {
      id: nextId("speech-transcription"),
      messageId: input.messageId,
      rawText: input.rawText,
      provider: input.provider,
      audioDurationMs: input.audioDurationMs,
      createdAt: new Date().toISOString(),
    };
    this.transcriptions.push(transcription);
    return transcription;
  }
}

export class FakeConversationAgent implements ConversationAgent {
  calls: ConversationReplyInput[] = [];
  nextReply = "Sure, tell me more about that.";

  async reply(input: ConversationReplyInput): Promise<string> {
    this.calls.push(input);
    return this.nextReply;
  }
}

export class FakeAnalysisRepository implements AnalysisRepository, AnalysisWriter {
  analyses = new Map<string, Analysis>();

  async create(conversationId: string): Promise<Analysis> {
    const analysis: Analysis = {
      id: nextId("analysis"),
      conversationId,
      status: "pending",
      attempts: 0,
      model: null,
      errorMessage: null,
      summary: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  async findById(id: string): Promise<Analysis | null> {
    return this.analyses.get(id) ?? null;
  }

  async findLatestByConversationId(conversationId: string): Promise<Analysis | null> {
    const matches = [...this.analyses.values()].filter(
      (analysis) => analysis.conversationId === conversationId,
    );
    return matches.at(-1) ?? null;
  }

  async markProcessing(id: string): Promise<void> {
    const analysis = this.analyses.get(id);
    if (!analysis) return;
    this.analyses.set(id, { ...analysis, status: "processing", attempts: analysis.attempts + 1 });
  }

  async markCompleted(id: string, input: MarkAnalysisCompletedInput): Promise<void> {
    const analysis = this.analyses.get(id);
    if (!analysis) return;
    this.analyses.set(id, {
      ...analysis,
      status: "completed",
      model: input.model,
      summary: input.summary,
      errorMessage: null,
      completedAt: new Date().toISOString(),
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const analysis = this.analyses.get(id);
    if (!analysis) return;
    this.analyses.set(id, { ...analysis, status: "failed", errorMessage });
  }

  seed(analysis: Analysis) {
    this.analyses.set(analysis.id, analysis);
  }
}

export class FakeFindingRepository implements FindingRepository, FindingWriter {
  findings: Finding[] = [];

  async create(input: CreateFindingInput): Promise<Finding> {
    const finding: Finding = {
      id: nextId("finding"),
      analysisId: input.analysisId,
      messageId: input.messageId,
      learningPointId: input.learningPointId,
      kind: input.kind,
      severity: input.severity,
      category: input.category,
      startOffset: input.startOffset,
      endOffset: input.endOffset,
      originalText: input.originalText,
      correction: input.correction,
      explanation: input.explanation,
      example: input.example,
      createdAt: new Date().toISOString(),
    };
    this.findings.push(finding);
    return finding;
  }

  async listByAnalysisId(analysisId: string): Promise<Finding[]> {
    return this.findings.filter((finding) => finding.analysisId === analysisId);
  }
}

export class FakeLearningPointRepository implements LearningPointRepository, LearningPointWriter {
  learningPoints: LearningPoint[] = [];

  async findByUserAndRuleKey(userId: string, ruleKey: string): Promise<LearningPoint | null> {
    return (
      this.learningPoints.find(
        (learningPoint) => learningPoint.userId === userId && learningPoint.ruleKey === ruleKey,
      ) ?? null
    );
  }

  async create(input: CreateLearningPointInput): Promise<LearningPoint> {
    const learningPoint: LearningPoint = {
      id: nextId("learning-point"),
      userId: input.userId,
      kind: input.kind,
      category: input.category,
      ruleKey: input.ruleKey,
      canonicalCorrection: input.canonicalCorrection,
      explanation: input.explanation,
      occurrenceCount: 1,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    this.learningPoints.push(learningPoint);
    return learningPoint;
  }

  async incrementOccurrence(id: string): Promise<LearningPoint> {
    const learningPoint = this.learningPoints.find((item) => item.id === id);
    if (!learningPoint) throw new Error("Learning point not found.");
    learningPoint.occurrenceCount += 1;
    learningPoint.lastSeenAt = new Date().toISOString();
    return learningPoint;
  }

  async listRuleKeysByUser(userId: string): Promise<string[]> {
    return this.learningPoints
      .filter((learningPoint) => learningPoint.userId === userId)
      .map((learningPoint) => learningPoint.ruleKey);
  }

  async listTopByUser(userId: string, limit: number): Promise<LearningPoint[]> {
    return this.learningPoints
      .filter((learningPoint) => learningPoint.userId === userId)
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, limit);
  }

  async listByIds(ids: string[]): Promise<LearningPoint[]> {
    return this.learningPoints.filter((learningPoint) => ids.includes(learningPoint.id));
  }
}

export class FakeFlashcardRepository implements FlashcardRepository {
  flashcards: Flashcard[] = [];

  async hasActiveForLearningPoint(learningPointId: string): Promise<boolean> {
    return this.flashcards.some(
      (flashcard) => flashcard.learningPointId === learningPointId && flashcard.status === "active",
    );
  }

  async createSuggested(input: CreateSuggestedFlashcardInput): Promise<Flashcard> {
    const flashcard: Flashcard = {
      id: nextId("flashcard"),
      userId: input.userId,
      learningPointId: input.learningPointId,
      sourceFindingId: input.sourceFindingId,
      cardType: input.cardType,
      front: input.front,
      back: input.back,
      explanation: input.explanation,
      status: "suggested",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.flashcards.push(flashcard);
    return flashcard;
  }

  async createManual(input: CreateManualFlashcardInput): Promise<Flashcard> {
    const flashcard: Flashcard = {
      id: nextId("flashcard"),
      userId: input.userId,
      learningPointId: null,
      sourceFindingId: null,
      cardType: "manual",
      front: input.front,
      back: input.back,
      explanation: input.explanation,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.flashcards.push(flashcard);
    return flashcard;
  }

  async findById(id: string): Promise<Flashcard | null> {
    return this.flashcards.find((flashcard) => flashcard.id === id) ?? null;
  }

  async listBySourceFindingIds(findingIds: string[]): Promise<Flashcard[]> {
    return this.flashcards.filter(
      (flashcard) =>
        flashcard.sourceFindingId !== null && findingIds.includes(flashcard.sourceFindingId),
    );
  }

  async listByUser(userId: string, status?: FlashcardStatus): Promise<Flashcard[]> {
    return this.flashcards.filter(
      (flashcard) => flashcard.userId === userId && (!status || flashcard.status === status),
    );
  }

  private updateFlashcard(id: string, patch: Partial<Flashcard>): Flashcard {
    const index = this.flashcards.findIndex((flashcard) => flashcard.id === id);
    if (index === -1) throw new Error("Flashcard not found.");
    this.flashcards[index] = {
      ...this.flashcards[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.flashcards[index];
  }

  async activate(id: string, overrides: FlashcardContentUpdate): Promise<Flashcard> {
    return this.updateFlashcard(id, { status: "active", ...overrides });
  }

  async discard(id: string): Promise<Flashcard> {
    return this.updateFlashcard(id, { status: "discarded" });
  }

  async updateContent(id: string, update: FlashcardContentUpdate): Promise<Flashcard> {
    return this.updateFlashcard(id, update);
  }

  async setStatus(id: string, status: "active" | "suspended"): Promise<Flashcard> {
    return this.updateFlashcard(id, { status });
  }

  seed(flashcard: Flashcard) {
    this.flashcards.push(flashcard);
  }
}

export class FakeCardScheduleRepository implements CardScheduleRepository {
  schedules = new Map<string, CardSchedule>();

  async create(flashcardId: string, schedule: ScheduleSnapshot): Promise<void> {
    this.schedules.set(flashcardId, { ...schedule, flashcardId });
  }

  async findByFlashcardId(flashcardId: string): Promise<CardSchedule | null> {
    return this.schedules.get(flashcardId) ?? null;
  }

  async update(flashcardId: string, schedule: ScheduleSnapshot): Promise<void> {
    this.schedules.set(flashcardId, { ...schedule, flashcardId });
  }

  async listDueForUser(userId: string, now: Date): Promise<DueFlashcard[]> {
    const due: DueFlashcard[] = [];
    for (const schedule of this.schedules.values()) {
      if (new Date(schedule.dueAt).getTime() > now.getTime()) continue;
      due.push({ flashcard: {} as Flashcard, schedule });
    }
    return due;
  }

  async listByFlashcardIds(flashcardIds: string[]): Promise<CardSchedule[]> {
    return flashcardIds
      .map((id) => this.schedules.get(id))
      .filter((schedule): schedule is CardSchedule => schedule !== undefined);
  }
}

export class FakeReviewLogRepository implements ReviewLogRepository {
  logs: ReviewLog[] = [];

  async create(input: CreateReviewLogInput): Promise<ReviewLog> {
    const log: ReviewLog = {
      id: nextId("review-log"),
      flashcardId: input.flashcardId,
      userId: input.userId,
      rating: input.rating,
      stateBefore: input.stateBefore,
      elapsedDays: input.elapsedDays,
      scheduledDays: input.scheduledDays,
      reviewedAt: new Date().toISOString(),
    };
    this.logs.push(log);
    return log;
  }

  async countTodayByUser(userId: string, now: Date): Promise<number> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    return this.logs.filter(
      (log) =>
        log.userId === userId && new Date(log.reviewedAt).getTime() >= startOfDay.getTime(),
    ).length;
  }
}

export class FakeReviewScheduler implements ReviewScheduler {
  calls: { current: ScheduleSnapshot; rating: Rating }[] = [];

  initialState(now: Date): ScheduleSnapshot {
    return {
      dueAt: now.toISOString(),
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: "new",
      lastReviewedAt: null,
    };
  }

  review(current: ScheduleSnapshot, rating: Rating, now: Date): ReviewOutcome {
    this.calls.push({ current, rating });
    const dueInDays = rating === "again" ? 0 : rating === "hard" ? 1 : rating === "good" ? 3 : 7;
    const dueAt = new Date(now.getTime() + dueInDays * 24 * 60 * 60 * 1000);

    return {
      schedule: {
        dueAt: dueAt.toISOString(),
        stability: current.stability + 1,
        difficulty: current.difficulty,
        reps: current.reps + 1,
        lapses: rating === "again" ? current.lapses + 1 : current.lapses,
        state: "review",
        lastReviewedAt: now.toISOString(),
      },
      elapsedDays: 0,
      scheduledDays: dueInDays,
    };
  }
}

export class FakeAnalysisAgent implements AnalysisAgent {
  readonly modelId = "fake-model";
  calls: AnalysisAgentInput[] = [];
  nextResult: AnalysisAgentResult = {
    summary: { mainPoints: [], recommendedExpressions: [] },
    findings: [],
  };
  shouldThrow: Error | null = null;

  async analyze(input: AnalysisAgentInput): Promise<AnalysisAgentResult> {
    this.calls.push(input);
    if (this.shouldThrow) throw this.shouldThrow;
    return this.nextResult;
  }
}
