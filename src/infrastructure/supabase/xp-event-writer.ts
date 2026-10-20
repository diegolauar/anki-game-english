import type { XpEvent } from "@/domain/entities/xp-event";
import type { CreateXpEventInput, XpEventWriter } from "@/domain/ports/xp-event-writer";
import type { XpSourceType } from "@/domain/value-objects/xp-source-type";
import type { ServiceRoleSupabaseClient } from "@/infrastructure/supabase/client-types";
import type { Database } from "@/infrastructure/supabase/database.types";

const UNIQUE_VIOLATION = "23505";

type XpEventRow = Pick<
  Database["public"]["Tables"]["xp_events"]["Row"],
  "id" | "user_id" | "source_type" | "source_id" | "amount" | "created_at"
>;

function toXpEvent(row: XpEventRow): XpEvent {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type as XpSourceType,
    sourceId: row.source_id,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

/** Escreve em `xp_events`, que só tem policy de RLS para SELECT — exige a service_role. */
export class SupabaseXpEventWriter implements XpEventWriter {
  constructor(private readonly client: ServiceRoleSupabaseClient) {}

  async create(input: CreateXpEventInput): Promise<XpEvent | null> {
    const { data, error } = await this.client
      .from("xp_events")
      .insert({
        user_id: input.userId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        amount: input.amount,
      })
      .select("id, user_id, source_type, source_id, amount, created_at")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) return null;
      throw error;
    }
    return toXpEvent(data);
  }
}
