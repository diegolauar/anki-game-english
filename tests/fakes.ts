import type { Analysis } from "@/domain/entities/analysis";
import type { Conversation } from "@/domain/entities/conversation";
import type { Finding } from "@/domain/entities/finding";
import type { Flashcard } from "@/domain/entities/flashcard";
import type { LearningPoint } from "@/domain/entities/learning-point";
import type { Message } from "@/domain/entities/message";
import type { Topic } from "@/domain/entities/topic";
import type {
  AnalysisAgent,
  AnalysisAgentInput,
  AnalysisAgentResult,
} from "@/domain/ports/analysis-agent";
import type {
  AnalysisRepository,
  MarkAnalysisCompletedInput,
} from "@/domain/ports/analysis-repository";
import type { ConversationAgent, ConversationReplyInput } from "@/domain/ports/conversation-agent";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "@/domain/ports/conversation-repository";
import type { CreateFindingInput, FindingRepository } from "@/domain/ports/finding-repository";
import type {
  CreateSuggestedFlashcardInput,
  FlashcardRepository,
} from "@/domain/ports/flashcard-repository";
import type {
  CreateLearningPointInput,
  LearningPointRepository,
} from "@/domain/ports/learning-point-repository";
import type { CreateMessageInput, MessageRepository } from "@/domain/ports/message-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";

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

export class FakeConversationAgent implements ConversationAgent {
  calls: ConversationReplyInput[] = [];
  nextReply = "Sure, tell me more about that.";

  async reply(input: ConversationReplyInput): Promise<string> {
    this.calls.push(input);
    return this.nextReply;
  }
}

export class FakeAnalysisRepository implements AnalysisRepository {
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

export class FakeFindingRepository implements FindingRepository {
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

export class FakeLearningPointRepository implements LearningPointRepository {
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

  seed(flashcard: Flashcard) {
    this.flashcards.push(flashcard);
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
