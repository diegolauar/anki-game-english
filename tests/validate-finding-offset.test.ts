import { describe, expect, it } from "vitest";
import { validateFindingOffset } from "@/domain/rules/validate-finding-offset";

describe("validateFindingOffset", () => {
  it("accepts offsets that already match the original text exactly", () => {
    const message = "I have worked a lot yesterday.";
    const originalText = "worked a lot yesterday.";
    const startOffset = message.indexOf(originalText);
    const endOffset = startOffset + originalText.length;

    const result = validateFindingOffset(message, startOffset, endOffset, originalText);

    expect(result).toEqual({ startOffset, endOffset });
  });

  it("relocates the text when the offsets are wrong but the text exists", () => {
    const message = "I have worked a lot yesterday.";
    const originalText = "worked a lot yesterday.";
    const correctStart = message.indexOf(originalText);

    const result = validateFindingOffset(message, 0, 5, originalText);

    expect(result).toEqual({
      startOffset: correctStart,
      endOffset: correctStart + originalText.length,
    });
  });

  it("returns null when the original text does not exist in the message at all", () => {
    const message = "I have worked a lot yesterday.";
    const result = validateFindingOffset(message, 0, 5, "something that was never said");

    expect(result).toBeNull();
  });
});
