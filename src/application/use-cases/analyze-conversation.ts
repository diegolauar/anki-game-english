import { validateFindingOffset } from "@/domain/rules/validate-finding-offset";
import type { AnalysisAgent } from "@/domain/ports/analysis-agent";
import type { AnalysisRepository } from "@/domain/ports/analysis-repository";
import type { AnalysisWriter } from "@/domain/ports/analysis-writer";
import type { ConversationRepository } from "@/domain/ports/conversation-repository";
import type { FindingWriter } from "@/domain/ports/finding-writer";
import type { FlashcardRepository } from "@/domain/ports/flashcard-repository";
import type { LearningPointRepository } from "@/domain/ports/learning-point-repository";
import type { LearningPointWriter } from "@/domain/ports/learning-point-writer";
import type { MessageRepository } from "@/domain/ports/message-repository";

export class AnalyzeConversation {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly analysisWriter: AnalysisWriter,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly learningPointRepository: LearningPointRepository,
    private readonly learningPointWriter: LearningPointWriter,
    private readonly findingWriter: FindingWriter,
    private readonly flashcardRepository: FlashcardRepository,
    private readonly analysisAgent: AnalysisAgent,
  ) {}

  async execute(analysisId: string): Promise<void> {
    const analysis = await this.analysisRepository.findById(analysisId);
    if (!analysis) throw new Error("Analysis not found.");
    if (analysis.status === "completed") return;

    const conversation = await this.conversationRepository.findById(analysis.conversationId);
    if (!conversation) throw new Error("Conversation not found.");

    await this.analysisWriter.markProcessing(analysisId);

    try {
      const messages = await this.messageRepository.listByConversation(conversation.id);
      const messagesBySequence = new Map(messages.map((message) => [message.sequence, message]));
      const existingRuleKeys = await this.learningPointRepository.listRuleKeysByUser(
        conversation.userId,
      );

      const result = await this.analysisAgent.analyze({
        messages: messages.map((message) => ({
          sequence: message.sequence,
          role: message.role,
          content: message.content,
        })),
        existingRuleKeys,
      });

      for (const findingResult of result.findings) {
        const message = messagesBySequence.get(findingResult.messageSequence);
        if (!message || message.role !== "user") {
          console.warn(
            `Discarding finding: message #${findingResult.messageSequence} not found or not from the user.`,
          );
          continue;
        }

        const validatedOffset = validateFindingOffset(
          message.content,
          findingResult.startOffset,
          findingResult.endOffset,
          findingResult.originalText,
        );
        if (!validatedOffset) {
          console.warn(
            `Discarding finding: original_text "${findingResult.originalText}" not found in message #${findingResult.messageSequence}.`,
          );
          continue;
        }

        const existingLearningPoint = await this.learningPointRepository.findByUserAndRuleKey(
          conversation.userId,
          findingResult.ruleKey,
        );
        const learningPoint = existingLearningPoint
          ? await this.learningPointWriter.incrementOccurrence(existingLearningPoint.id)
          : await this.learningPointWriter.create({
              userId: conversation.userId,
              kind: findingResult.kind,
              category: findingResult.category,
              ruleKey: findingResult.ruleKey,
              canonicalCorrection: findingResult.correction,
              explanation: findingResult.explanation,
            });

        const finding = await this.findingWriter.create({
          analysisId,
          messageId: message.id,
          learningPointId: learningPoint.id,
          kind: findingResult.kind,
          severity: findingResult.severity,
          category: findingResult.category,
          startOffset: validatedOffset.startOffset,
          endOffset: validatedOffset.endOffset,
          originalText: findingResult.originalText,
          correction: findingResult.correction,
          explanation: findingResult.explanation,
          example: findingResult.example,
        });

        if (findingResult.flashcardSuggestion) {
          const hasActiveFlashcard = await this.flashcardRepository.hasActiveForLearningPoint(
            learningPoint.id,
          );
          if (!hasActiveFlashcard) {
            await this.flashcardRepository.createSuggested({
              userId: conversation.userId,
              learningPointId: learningPoint.id,
              sourceFindingId: finding.id,
              cardType: findingResult.flashcardSuggestion.cardType,
              front: findingResult.flashcardSuggestion.front,
              back: findingResult.flashcardSuggestion.back,
              explanation: findingResult.explanation,
            });
          }
        }
      }

      await this.analysisWriter.markCompleted(analysisId, {
        model: this.analysisAgent.modelId,
        summary: result.summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      await this.analysisWriter.markFailed(analysisId, message);
      throw error;
    }
  }
}
