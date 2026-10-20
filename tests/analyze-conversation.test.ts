import { describe, expect, it } from "vitest";
import { AnalyzeConversation } from "@/application/use-cases/analyze-conversation";
import type { AnalysisFindingResult } from "@/domain/ports/analysis-agent";
import type { Conversation } from "@/domain/entities/conversation";
import type { Message } from "@/domain/entities/message";
import {
  FakeAnalysisAgent,
  FakeAnalysisRepository,
  FakeConversationRepository,
  FakeFindingRepository,
  FakeFlashcardRepository,
  FakeLearningPointRepository,
  FakeMessageRepository,
} from "./fakes";

function buildConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conversation-1",
    userId: "user-1",
    topicId: null,
    customTopic: "Daily routine",
    difficulty: "beginner",
    status: "finished",
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildUserMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    role: "user",
    content: "I have worked a lot yesterday.",
    inputMode: "text",
    sequence: 1,
    clientMessageId: "client-1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildFindingResult(
  overrides: Partial<AnalysisFindingResult> = {},
): AnalysisFindingResult {
  return {
    messageSequence: 1,
    originalText: "have worked a lot yesterday",
    startOffset: 2,
    endOffset: 30,
    kind: "error",
    severity: "high",
    category: "grammar.verb_tense",
    ruleKey: "simple_past_with_finished_time",
    correction: "worked a lot yesterday",
    explanation: "Use o Simple Past para uma ação concluída num momento específico.",
    example: "I watched a movie last night.",
    flashcardSuggestion: null,
    ...overrides,
  };
}

function buildUseCase() {
  const analysisRepository = new FakeAnalysisRepository();
  const conversationRepository = new FakeConversationRepository();
  const messageRepository = new FakeMessageRepository();
  const learningPointRepository = new FakeLearningPointRepository();
  const findingRepository = new FakeFindingRepository();
  const flashcardRepository = new FakeFlashcardRepository();
  const analysisAgent = new FakeAnalysisAgent();

  const useCase = new AnalyzeConversation(
    analysisRepository,
    conversationRepository,
    messageRepository,
    learningPointRepository,
    findingRepository,
    flashcardRepository,
    analysisAgent,
  );

  return {
    useCase,
    analysisRepository,
    conversationRepository,
    messageRepository,
    learningPointRepository,
    findingRepository,
    flashcardRepository,
    analysisAgent,
  };
}

describe("AnalyzeConversation", () => {
  it("creates a learning point and a finding from a valid result", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: ["Falou sobre o trabalho."], recommendedExpressions: [] },
      findings: [buildFindingResult()],
    };

    await context.useCase.execute(analysis.id);

    const completed = await context.analysisRepository.findById(analysis.id);
    expect(completed?.status).toBe("completed");
    expect(completed?.summary?.mainPoints).toEqual(["Falou sobre o trabalho."]);

    expect(context.learningPointRepository.learningPoints).toHaveLength(1);
    expect(context.learningPointRepository.learningPoints[0].occurrenceCount).toBe(1);
    expect(context.findingRepository.findings).toHaveLength(1);
  });

  it("reuses the same learning point and increments occurrence on a recurring rule_key", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    context.learningPointRepository.learningPoints.push({
      id: "learning-point-1",
      userId: "user-1",
      kind: "error",
      category: "grammar.verb_tense",
      ruleKey: "simple_past_with_finished_time",
      canonicalCorrection: "worked a lot yesterday",
      explanation: null,
      occurrenceCount: 2,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [buildFindingResult()],
    };

    await context.useCase.execute(analysis.id);

    expect(context.learningPointRepository.learningPoints).toHaveLength(1);
    expect(context.learningPointRepository.learningPoints[0].occurrenceCount).toBe(3);
    expect(context.findingRepository.findings[0].learningPointId).toBe("learning-point-1");
  });

  it("discards a finding whose original_text cannot be located in the message", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [buildFindingResult({ originalText: "something never said" })],
    };

    await context.useCase.execute(analysis.id);

    expect(context.findingRepository.findings).toHaveLength(0);
    expect(context.learningPointRepository.learningPoints).toHaveLength(0);
    const completed = await context.analysisRepository.findById(analysis.id);
    expect(completed?.status).toBe("completed");
  });

  it("discards a finding pointing at a message that does not exist", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [buildFindingResult({ messageSequence: 99 })],
    };

    await context.useCase.execute(analysis.id);

    expect(context.findingRepository.findings).toHaveLength(0);
  });

  it("discards a finding pointing at an assistant message", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    context.messageRepository.seed(
      buildUserMessage({
        id: "message-2",
        role: "assistant",
        sequence: 2,
        content: "That sounds tiring!",
        clientMessageId: "client-2",
      }),
    );
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [buildFindingResult({ messageSequence: 2, originalText: "That sounds tiring!" })],
    };

    await context.useCase.execute(analysis.id);

    expect(context.findingRepository.findings).toHaveLength(0);
  });

  it("creates a suggested flashcard when the learning point has no active one", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [
        buildFindingResult({
          flashcardSuggestion: {
            cardType: "production",
            front: "Como digo que trabalhei muito ontem?",
            back: "I worked a lot yesterday.",
          },
        }),
      ],
    };

    await context.useCase.execute(analysis.id);

    expect(context.flashcardRepository.flashcards).toHaveLength(1);
    expect(context.flashcardRepository.flashcards[0].status).toBe("suggested");
  });

  it("does not create a new flashcard when the learning point already has an active one", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    context.learningPointRepository.learningPoints.push({
      id: "learning-point-1",
      userId: "user-1",
      kind: "error",
      category: "grammar.verb_tense",
      ruleKey: "simple_past_with_finished_time",
      canonicalCorrection: null,
      explanation: null,
      occurrenceCount: 1,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    });
    context.flashcardRepository.seed({
      id: "flashcard-1",
      userId: "user-1",
      learningPointId: "learning-point-1",
      sourceFindingId: "finding-0",
      cardType: "production",
      front: "front",
      back: "back",
      explanation: null,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [
        buildFindingResult({
          flashcardSuggestion: {
            cardType: "production",
            front: "Como digo que trabalhei muito ontem?",
            back: "I worked a lot yesterday.",
          },
        }),
      ],
    };

    await context.useCase.execute(analysis.id);

    expect(context.flashcardRepository.flashcards).toHaveLength(1);
  });

  it("marks the analysis as failed when the agent throws", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.shouldThrow = new Error("LLM is down");

    await expect(context.useCase.execute(analysis.id)).rejects.toThrow("LLM is down");

    const failed = await context.analysisRepository.findById(analysis.id);
    expect(failed?.status).toBe("failed");
    expect(failed?.errorMessage).toBe("LLM is down");
  });

  it("is a no-op when the analysis is already completed", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    await context.analysisRepository.markCompleted(analysis.id, {
      model: "fake-model",
      summary: { mainPoints: [], recommendedExpressions: [] },
    });

    await context.useCase.execute(analysis.id);

    expect(context.analysisAgent.calls).toHaveLength(0);
  });

  it("stores a 'suggestion' finding as-is, never coercing it into an 'error'", async () => {
    const context = buildUseCase();
    context.conversationRepository.seed(buildConversation());
    context.messageRepository.seed(buildUserMessage());
    const analysis = await context.analysisRepository.create("conversation-1");
    context.analysisAgent.nextResult = {
      summary: { mainPoints: [], recommendedExpressions: [] },
      findings: [
        buildFindingResult({
          kind: "suggestion",
          severity: "low",
          category: "naturalness.unnatural_expression",
          ruleKey: "more_natural_phrasing",
        }),
      ],
    };

    await context.useCase.execute(analysis.id);

    expect(context.findingRepository.findings).toHaveLength(1);
    expect(context.findingRepository.findings[0].kind).toBe("suggestion");
    expect(context.learningPointRepository.learningPoints[0].kind).toBe("suggestion");
  });
});
