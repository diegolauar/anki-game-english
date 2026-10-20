import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logError, logWarn } from "@/lib/logger";

describe("logger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("logs a structured JSON line with event, context and the error message/stack", () => {
    logError("analyze_conversation_failed", { analysisId: "a1", userId: "u1" }, new Error("boom"));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(errorSpy.mock.calls[0][0] as string);

    expect(entry).toMatchObject({
      level: "error",
      event: "analyze_conversation_failed",
      analysisId: "a1",
      userId: "u1",
      error: { message: "boom", name: "Error" },
    });
    expect(entry.error.stack).toEqual(expect.any(String));
    expect(entry.timestamp).toEqual(expect.any(String));
  });

  it("serializes a non-Error thrown value instead of crashing", () => {
    logError("llm_usage_log_failed", {}, "a plain string error");

    const entry = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(entry.error).toEqual({ message: "a plain string error" });
  });

  it("omits the error field entirely when none is given", () => {
    logError("something_happened", { userId: "u1" });

    const entry = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(entry).not.toHaveProperty("error");
  });

  it("logs warnings the same way, on console.warn", () => {
    logWarn("analysis_finding_discarded", { reason: "message_not_found" });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: "warn", event: "analysis_finding_discarded" });
  });
});
