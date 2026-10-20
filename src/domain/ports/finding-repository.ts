import type { Finding } from "@/domain/entities/finding";

/** Somente leitura — `findings` só tem policy de RLS para SELECT do próprio usuário. */
export interface FindingRepository {
  listByAnalysisId(analysisId: string): Promise<Finding[]>;
}
