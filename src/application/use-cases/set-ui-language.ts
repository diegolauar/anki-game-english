import type { UserProfileWriter } from "@/domain/ports/user-profile-writer";
import type { Locale } from "@/domain/value-objects/locale";

export class SetUiLanguage {
  constructor(private readonly profileWriter: UserProfileWriter) {}

  async execute(userId: string, uiLanguage: Locale): Promise<void> {
    await this.profileWriter.updatePreferences(userId, { uiLanguage });
  }
}
