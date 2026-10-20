import { describe, expect, it } from "vitest";
import { GetDashboard } from "@/application/use-cases/get-dashboard";
import {
  FakeAnalysisRepository,
  FakeCardScheduleRepository,
  FakeConversationRepository,
  FakeFindingRepository,
  FakeLearningPointRepository,
  FakeMessageRepository,
  FakeReviewLogRepository,
  FakeTopicRepository,
  FakeUserProfileRepository,
  FakeXpEventRepository,
} from "./fakes";

function buildDashboard() {
  const userProfileRepository = new FakeUserProfileRepository();
  const topicRepository = new FakeTopicRepository();
  const cardScheduleRepository = new FakeCardScheduleRepository();
  const xpEventRepository = new FakeXpEventRepository();
  const conversationRepository = new FakeConversationRepository();
  const messageRepository = new FakeMessageRepository();
  const analysisRepository = new FakeAnalysisRepository();
  const learningPointRepository = new FakeLearningPointRepository();
  const reviewLogRepository = new FakeReviewLogRepository();
  const findingRepository = new FakeFindingRepository();

  const getDashboard = new GetDashboard(
    userProfileRepository,
    topicRepository,
    cardScheduleRepository,
    xpEventRepository,
    conversationRepository,
    messageRepository,
    analysisRepository,
    learningPointRepository,
    reviewLogRepository,
    findingRepository,
  );

  return {
    getDashboard,
    topicRepository,
    xpEventRepository,
    conversationRepository,
    messageRepository,
    analysisRepository,
    learningPointRepository,
    reviewLogRepository,
    findingRepository,
  };
}

describe("GetDashboard", () => {
  it("resolves recent conversations with topic title, message count and analysis status", async () => {
    const deps = buildDashboard();
    deps.topicRepository.topics = [
      { id: "topic-1", slug: "travel", title: "Viagens", description: null, category: "travel", difficulty: "beginner" },
    ];
    deps.conversationRepository.seed({
      id: "conv-1",
      userId: "user-1",
      topicId: "topic-1",
      customTopic: null,
      difficulty: "beginner",
      status: "finished",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    });
    deps.messageRepository.seed({
      id: "m1",
      conversationId: "conv-1",
      role: "user",
      content: "Hi",
      inputMode: "text",
      sequence: 1,
      clientMessageId: "c1",
      createdAt: new Date().toISOString(),
    });
    deps.analysisRepository.seed({
      id: "analysis-1",
      conversationId: "conv-1",
      status: "completed",
      attempts: 1,
      model: "gpt",
      errorMessage: null,
      summary: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    const result = await deps.getDashboard.execute("user-1");

    expect(result.recentConversations).toHaveLength(1);
    expect(result.recentConversations[0]).toMatchObject({
      id: "conv-1",
      title: "Viagens",
      category: "travel",
      messageCount: 1,
      analysisStatus: "completed",
    });
  });

  it("falls back to a generic title when the conversation has no topic or custom topic", async () => {
    const deps = buildDashboard();
    deps.conversationRepository.seed({
      id: "conv-2",
      userId: "user-1",
      topicId: null,
      customTopic: null,
      difficulty: "beginner",
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
    });

    const result = await deps.getDashboard.execute("user-1");

    expect(result.recentConversations[0]).toMatchObject({
      title: "Conversa",
      analysisStatus: "none",
    });
  });

  it("returns the top learning points ordered by occurrence count", async () => {
    const deps = buildDashboard();
    deps.learningPointRepository.learningPoints = [
      {
        id: "lp-1",
        userId: "user-1",
        kind: "error",
        category: "grammar.verb_tense",
        ruleKey: "simple_past_with_finished_time",
        canonicalCorrection: "worked",
        explanation: null,
        occurrenceCount: 1,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
      {
        id: "lp-2",
        userId: "user-1",
        kind: "error",
        category: "grammar.articles",
        ruleKey: "missing_article",
        canonicalCorrection: "a job",
        explanation: null,
        occurrenceCount: 4,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ];

    const result = await deps.getDashboard.execute("user-1");

    expect(result.topLearningPoints.map((point) => point.id)).toEqual(["lp-2", "lp-1"]);
  });

  it("aggregates XP events into daily totals within the requested window", async () => {
    const deps = buildDashboard();
    const today = new Date().toISOString();
    await deps.xpEventRepository.create({
      userId: "user-1",
      sourceType: "conversation_finished",
      sourceId: "conv-1",
      amount: 20,
    });
    deps.xpEventRepository.events[0].createdAt = today;

    const result = await deps.getDashboard.execute("user-1");

    const todayKey = today.slice(0, 10);
    expect(result.weeklyXp).toContainEqual({ dateKey: todayKey, amount: 20 });
  });
});
