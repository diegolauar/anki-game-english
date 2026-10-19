import type { UserProfile } from "@/domain/entities/user-profile";

export interface UserProfileRepository {
  getById(userId: string): Promise<UserProfile | null>;
}
