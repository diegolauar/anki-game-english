import type { Message } from "@/domain/entities/message";
import type { ConversationAgent } from "@/domain/ports/conversation-agent";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { MessageRepository } from "@/domain/ports/message-repository";
import type { SpeechTranscriptionRepository } from "@/domain/ports/speech-transcription-repository";
import type { TopicRepository } from "@/domain/ports/topic-repository";
import type { InputMode } from "@/domain/value-objects/input-mode";

export interface VoiceTranscriptionInput {
  rawText: string;
  provider: string;
  audioDurationMs: number | null;
}

export interface SendMessageInput {
  conversationId: string;
  userId: string;
  content: string;
  inputMode: InputMode;
  clientMessageId: string;
  voiceTranscription?: VoiceTranscriptionInput;
}

export interface SendMessageResult {
  userMessage: Message;
  assistantMessage: Message;
}

function assistantClientMessageId(userClientMessageId: string): string {
  return `${userClientMessageId}:assistant`;
}

export class SendMessage {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly topicRepository: TopicRepository,
    private readonly conversationAgent: ConversationAgent,
    private readonly speechTranscriptionRepository: SpeechTranscriptionRepository,
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageResult> {
    const conversation = await this.conversationRepository.findById(input.conversationId);

    if (!conversation || conversation.userId !== input.userId) {
      throw new Error("Conversation not found.");
    }
    if (conversation.status !== "active") {
      throw new Error("This conversation is no longer active.");
    }

    const existingUserMessage = await this.messageRepository.findByClientMessageId(
      input.conversationId,
      input.clientMessageId,
    );

    const userMessage =
      existingUserMessage ??
      (await this.messageRepository.create({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
        inputMode: input.inputMode,
        clientMessageId: input.clientMessageId,
      }));

    if (!existingUserMessage && input.voiceTranscription) {
      await this.speechTranscriptionRepository.create({
        messageId: userMessage.id,
        rawText: input.voiceTranscription.rawText,
        provider: input.voiceTranscription.provider,
        audioDurationMs: input.voiceTranscription.audioDurationMs,
      });
    }

    const assistantId = assistantClientMessageId(input.clientMessageId);
    const existingAssistantMessage = await this.messageRepository.findByClientMessageId(
      input.conversationId,
      assistantId,
    );

    if (existingAssistantMessage) {
      return { userMessage, assistantMessage: existingAssistantMessage };
    }

    const topic = conversation.customTopic ?? (await this.resolveTopicTitle(conversation.topicId));
    const history = await this.messageRepository.listByConversation(input.conversationId);

    const replyContent = await this.conversationAgent.reply({
      topic,
      difficulty: conversation.difficulty,
      history: history.map((message) => ({ role: message.role, content: message.content })),
    });

    const assistantMessage = await this.messageRepository.create({
      conversationId: input.conversationId,
      role: "assistant",
      content: replyContent,
      inputMode: "text",
      clientMessageId: assistantId,
    });

    return { userMessage, assistantMessage };
  }

  private async resolveTopicTitle(topicId: string | null): Promise<string> {
    if (!topicId) return "general conversation";
    const topic = await this.topicRepository.findById(topicId);
    return topic?.title ?? "general conversation";
  }
}
