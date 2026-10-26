import { describe, expect, it } from "vitest";
import { SetUiLanguage } from "@/application/use-cases/set-ui-language";
import { getUiLanguage } from "@/domain/rules/ui-language";
import { FakeUserProfileRepository, FakeUserProfileWriter } from "./fakes";

describe("SetUiLanguage", () => {
  it("persists the chosen locale into the user's preferences", async () => {
    const repository = new FakeUserProfileRepository();
    repository.seed({
      id: "user-1",
      displayName: "Ana",
      targetLevel: "beginner",
      preferences: {},
    });
    const writer = new FakeUserProfileWriter(repository);
    const useCase = new SetUiLanguage(writer);

    await useCase.execute("user-1", "en-US");

    const profile = await repository.getById("user-1");
    expect(getUiLanguage(profile?.preferences ?? {})).toBe("en-US");
  });

  it("merges the preference without wiping existing keys", async () => {
    const repository = new FakeUserProfileRepository();
    repository.seed({
      id: "user-1",
      displayName: "Ana",
      targetLevel: "beginner",
      preferences: { dailyMessageLimit: 30 },
    });
    const writer = new FakeUserProfileWriter(repository);
    const useCase = new SetUiLanguage(writer);

    await useCase.execute("user-1", "es");

    const profile = await repository.getById("user-1");
    expect(profile?.preferences).toMatchObject({ dailyMessageLimit: 30, uiLanguage: "es" });
  });
});
