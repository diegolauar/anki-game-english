import { describe, expect, it } from "vitest";
import { SendMessage } from "@/application/use-cases/send-message";
import type { Conversation } from "@/domain/entities/conversation";
import {
  FakeConversationAgent,
  FakeConversationRepository,
  FakeDailyUsageRepository,
  FakeMessageRepository,
  FakeSpeechTranscriptionRepository,
  FakeTopicRepository,
  FakeUserProfileRepository,
} from "./fakes";

function buildConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conversation-1",
    userId: "user-1",
    topicId: null,
    customTopic: "Daily routine",
    difficulty: "beginner",
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null,
    ...overrides,
  };
}

function buildUseCase() {
  const conversationRepository = new FakeConversationRepository();
  const messageRepository = new FakeMessageRepository();
  const topicRepository = new FakeTopicRepository();
  const conversationAgent = new FakeConversationAgent();
  const speechTranscriptionRepository = new FakeSpeechTranscriptionRepository();
  const userProfileRepository = new FakeUserProfileRepository();
  const dailyUsageRepository = new FakeDailyUsageRepository();
  const useCase = new SendMessage(
    conversationRepository,
    messageRepository,
    topicRepository,
    conversationAgent,
    speechTranscriptionRepository,
    userProfileRepository,
    dailyUsageRepository,
  );
  return {
    useCase,
    conversationRepository,
    messageRepository,
    topicRepository,
    conversationAgent,
    speechTranscriptionRepository,
    userProfileRepository,
    dailyUsageRepository,
  };
}

describe("SendMessage", () => {
  it("throws when the conversation does not exist", async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        conversationId: "missing",
        userId: "user-1",
        content: "Hello",
        inputMode: "text",
        clientMessageId: "client-1",
      }),
    ).rejects.toThrow();
  });

  it("throws when the conversation belongs to another user", async () => {
    const { useCase, conversationRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());

    await expect(
      useCase.execute({
        conversationId: "conversation-1",
        userId: "someone-else",
        content: "Hello",
        inputMode: "text",
        clientMessageId: "client-1",
      }),
    ).rejects.toThrow();
  });

  it("throws when the conversation is not active", async () => {
    const { useCase, conversationRepository } = buildUseCase();
    conversationRepository.seed(buildConversation({ status: "finished" }));

    await expect(
      useCase.execute({
        conversationId: "conversation-1",
        userId: "user-1",
        content: "Hello",
        inputMode: "text",
        clientMessageId: "client-1",
      }),
    ).rejects.toThrow();
  });

  it("creates the user message and an assistant reply", async () => {
    const { useCase, conversationRepository, messageRepository, conversationAgent } =
      buildUseCase();
    conversationRepository.seed(buildConversation());
    conversationAgent.nextReply = "Nice! What time do you usually wake up?";

    const result = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    expect(result.userMessage.content).toBe("I wake up at 7am.");
    expect(result.userMessage.role).toBe("user");
    expect(result.assistantMessage.content).toBe("Nice! What time do you usually wake up?");
    expect(result.assistantMessage.role).toBe("assistant");
    expect(result.assistantMessage.sequence).toBe(result.userMessage.sequence + 1);
    expect(conversationAgent.calls).toHaveLength(1);
    expect(messageRepository.messages).toHaveLength(2);
  });

  it("does not duplicate messages on a retried client_message_id", async () => {
    const { useCase, conversationRepository, messageRepository, conversationAgent } =
      buildUseCase();
    conversationRepository.seed(buildConversation());

    const first = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    const retry = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    expect(retry.userMessage.id).toBe(first.userMessage.id);
    expect(retry.assistantMessage.id).toBe(first.assistantMessage.id);
    expect(conversationAgent.calls).toHaveLength(1);
    expect(messageRepository.messages).toHaveLength(2);
  });

  it("resumes and generates the assistant reply when only the user message was persisted", async () => {
    const { useCase, conversationRepository, messageRepository, conversationAgent } =
      buildUseCase();
    conversationRepository.seed(buildConversation());

    await messageRepository.create({
      conversationId: "conversation-1",
      role: "user",
      content: "I wake up at 7am.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    const result = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    expect(messageRepository.messages).toHaveLength(2);
    expect(result.assistantMessage.role).toBe("assistant");
    expect(conversationAgent.calls).toHaveLength(1);
  });

  it("resolves the topic from the topic repository when no custom topic is set", async () => {
    const { useCase, conversationRepository, topicRepository, conversationAgent } =
      buildUseCase();
    conversationRepository.seed(buildConversation({ customTopic: null, topicId: "topic-1" }));
    topicRepository.topics.push({
      id: "topic-1",
      slug: "travel",
      title: "Travel",
      description: null,
      category: null,
      difficulty: "beginner",
    });

    await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I love visiting new places.",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    expect(conversationAgent.calls[0].topic).toBe("Travel");
  });

  it("stores the raw voice transcription linked to the new user message", async () => {
    const { useCase, conversationRepository, speechTranscriptionRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());

    const result = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "voice",
      clientMessageId: "client-1",
      voiceTranscription: {
        rawText: "I wake up at seven am",
        provider: "openai-whisper",
        audioDurationMs: 4200,
      },
    });

    expect(speechTranscriptionRepository.transcriptions).toHaveLength(1);
    expect(speechTranscriptionRepository.transcriptions[0]).toMatchObject({
      messageId: result.userMessage.id,
      rawText: "I wake up at seven am",
      provider: "openai-whisper",
      audioDurationMs: 4200,
    });
  });

  it("does not create a duplicate transcription on a retried voice message", async () => {
    const { useCase, conversationRepository, speechTranscriptionRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());

    const voiceTranscription = {
      rawText: "I wake up at seven am",
      provider: "openai-whisper",
      audioDurationMs: 4200,
    };

    await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "voice",
      clientMessageId: "client-1",
      voiceTranscription,
    });

    await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "I wake up at 7am.",
      inputMode: "voice",
      clientMessageId: "client-1",
      voiceTranscription,
    });

    expect(speechTranscriptionRepository.transcriptions).toHaveLength(1);
  });

  it("blocks a new message once the daily message limit is reached", async () => {
    const { useCase, conversationRepository, dailyUsageRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());
    dailyUsageRepository.usage = { messageCount: 50, voiceMinutes: 0 };

    await expect(
      useCase.execute({
        conversationId: "conversation-1",
        userId: "user-1",
        content: "One more message",
        inputMode: "text",
        clientMessageId: "client-1",
      }),
    ).rejects.toThrow();
  });

  it("does not block a retried message even if the daily limit was already reached", async () => {
    const { useCase, conversationRepository, messageRepository, dailyUsageRepository } =
      buildUseCase();
    conversationRepository.seed(buildConversation());
    await messageRepository.create({
      conversationId: "conversation-1",
      role: "user",
      content: "Already sent",
      inputMode: "text",
      clientMessageId: "client-1",
    });
    dailyUsageRepository.usage = { messageCount: 50, voiceMinutes: 0 };

    const result = await useCase.execute({
      conversationId: "conversation-1",
      userId: "user-1",
      content: "Already sent",
      inputMode: "text",
      clientMessageId: "client-1",
    });

    expect(result.userMessage.content).toBe("Already sent");
  });

  it("blocks a new voice message once the daily voice minutes limit is reached", async () => {
    const { useCase, conversationRepository, dailyUsageRepository } = buildUseCase();
    conversationRepository.seed(buildConversation());
    dailyUsageRepository.usage = { messageCount: 1, voiceMinutes: 15 };

    await expect(
      useCase.execute({
        conversationId: "conversation-1",
        userId: "user-1",
        content: "One more voice message",
        inputMode: "voice",
        clientMessageId: "client-1",
        voiceTranscription: { rawText: "one more", provider: "openai-whisper", audioDurationMs: 3000 },
      }),
    ).rejects.toThrow();
  });

  it("respects a custom daily message limit from the user's preferences", async () => {
    const { useCase, conversationRepository, userProfileRepository, dailyUsageRepository } =
      buildUseCase();
    conversationRepository.seed(buildConversation());
    userProfileRepository.seed({
      id: "user-1",
      displayName: null,
      targetLevel: "beginner",
      preferences: { dailyMessageLimit: 2 },
    });
    dailyUsageRepository.usage = { messageCount: 2, voiceMinutes: 0 };

    await expect(
      useCase.execute({
        conversationId: "conversation-1",
        userId: "user-1",
        content: "Over the custom limit",
        inputMode: "text",
        clientMessageId: "client-1",
      }),
    ).rejects.toThrow();
  });
});
