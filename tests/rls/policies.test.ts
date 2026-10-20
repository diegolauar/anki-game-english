import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  createAnonTestClient,
  createServiceRoleTestClient,
  ensureRlsTestUser,
  type RlsTestUser,
} from "./setup";

const UNIQUE_VIOLATION = "23505";

let userA: RlsTestUser;
let userB: RlsTestUser;

beforeAll(async () => {
  userA = await ensureRlsTestUser("rls-user-a@example.com", "rls-test-password-a");
  userB = await ensureRlsTestUser("rls-user-b@example.com", "rls-test-password-b");
}, 30_000);

describe("topics", () => {
  it("lets anon read active topics", async () => {
    const { data, error } = await createAnonTestClient().from("topics").select("id").limit(1);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});

describe("conversations (own-row insert/select/update)", () => {
  it("lets a user insert a conversation for themselves", async () => {
    const { data, error } = await userA.client
      .from("conversations")
      .insert({ user_id: userA.id, custom_topic: "RLS test topic", difficulty: "beginner" })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.user_id).toBe(userA.id);
  });

  it("blocks a user from inserting a conversation on someone else's behalf", async () => {
    const { data, error } = await userA.client
      .from("conversations")
      .insert({ user_id: userB.id, custom_topic: "Impersonation attempt", difficulty: "beginner" })
      .select()
      .single();

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("hides another user's conversations from select", async () => {
    const { data: created, error: createError } = await userB.client
      .from("conversations")
      .insert({ user_id: userB.id, custom_topic: "User B's private topic", difficulty: "beginner" })
      .select()
      .single();
    expect(createError).toBeNull();

    const { data, error } = await userA.client
      .from("conversations")
      .select("id")
      .eq("id", created!.id);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("blocks anon from reading or inserting conversations", async () => {
    const anon = createAnonTestClient();
    const { data: selected, error: selectError } = await anon.from("conversations").select("id");
    expect(selectError).toBeNull();
    expect(selected).toEqual([]);

    const { error: insertError } = await anon
      .from("conversations")
      .insert({ user_id: userA.id, custom_topic: "Anon attempt", difficulty: "beginner" });
    expect(insertError).not.toBeNull();
  });
});

describe("messages (append-only, ownership via conversation)", () => {
  it("lets a user insert a message into their own conversation, but not into another user's", async () => {
    const { data: conversation } = await userA.client
      .from("conversations")
      .insert({ user_id: userA.id, custom_topic: "RLS messages test", difficulty: "beginner" })
      .select()
      .single();

    const ownMessage = await userA.client
      .from("messages")
      .insert({
        conversation_id: conversation!.id,
        role: "user",
        content: "Hello from the owner",
        input_mode: "text",
        sequence: 1,
        client_message_id: randomUUID(),
      })
      .select()
      .single();
    expect(ownMessage.error).toBeNull();

    const foreignAttempt = await userB.client
      .from("messages")
      .insert({
        conversation_id: conversation!.id,
        role: "user",
        content: "Intrusion attempt",
        input_mode: "text",
        sequence: 2,
        client_message_id: randomUUID(),
      })
      .select()
      .single();
    expect(foreignAttempt.data).toBeNull();
    expect(foreignAttempt.error).not.toBeNull();
  });

  it("rejects updates and deletes even from the service role (append-only trigger)", async () => {
    const service = createServiceRoleTestClient();
    const { data: conversation } = await userA.client
      .from("conversations")
      .insert({ user_id: userA.id, custom_topic: "RLS append-only test", difficulty: "beginner" })
      .select()
      .single();
    const { data: message } = await userA.client
      .from("messages")
      .insert({
        conversation_id: conversation!.id,
        role: "user",
        content: "Original content",
        input_mode: "text",
        sequence: 1,
        client_message_id: randomUUID(),
      })
      .select()
      .single();

    const updateResult = await service
      .from("messages")
      .update({ content: "Tampered content" })
      .eq("id", message!.id);
    expect(updateResult.error).not.toBeNull();

    const deleteResult = await service.from("messages").delete().eq("id", message!.id);
    expect(deleteResult.error).not.toBeNull();
  });
});

describe("analyses, findings, learning_points (service-role-only writes)", () => {
  it("blocks a regular user from inserting an analysis, but allows the service role", async () => {
    const { data: conversation } = await userA.client
      .from("conversations")
      .insert({ user_id: userA.id, custom_topic: "RLS analysis test", difficulty: "beginner" })
      .select()
      .single();

    const userAttempt = await userA.client
      .from("analyses")
      .insert({ conversation_id: conversation!.id })
      .select()
      .single();
    expect(userAttempt.data).toBeNull();
    expect(userAttempt.error).not.toBeNull();

    const service = createServiceRoleTestClient();
    const serviceAttempt = await service
      .from("analyses")
      .insert({ conversation_id: conversation!.id })
      .select()
      .single();
    expect(serviceAttempt.error).toBeNull();
    expect(serviceAttempt.data?.conversation_id).toBe(conversation!.id);
  });

  it("blocks a regular user from inserting a learning_point directly", async () => {
    const { error } = await userA.client.from("learning_points").insert({
      user_id: userA.id,
      kind: "error",
      category: "grammar.verb_tense",
      rule_key: `rls_test_${randomUUID()}`,
    });
    expect(error).not.toBeNull();
  });

  it("lets the owner select their own analysis but not another user's", async () => {
    const { data: conversation } = await userB.client
      .from("conversations")
      .insert({ user_id: userB.id, custom_topic: "User B analysis", difficulty: "beginner" })
      .select()
      .single();
    const service = createServiceRoleTestClient();
    const { data: analysis } = await service
      .from("analyses")
      .insert({ conversation_id: conversation!.id })
      .select()
      .single();

    const ownerRead = await userB.client.from("analyses").select("id").eq("id", analysis!.id);
    expect(ownerRead.data).toHaveLength(1);

    const otherRead = await userA.client.from("analyses").select("id").eq("id", analysis!.id);
    expect(otherRead.data).toEqual([]);
  });
});

describe("xp_events (append-only, idempotent via unique constraint)", () => {
  it("blocks a regular user from awarding themselves XP directly", async () => {
    const { error } = await userA.client.from("xp_events").insert({
      user_id: userA.id,
      source_type: "flashcard_reviewed",
      source_id: randomUUID(),
      amount: 999,
    });
    expect(error).not.toBeNull();
  });

  it("never pays the same source twice, enforced by a unique constraint", async () => {
    const service = createServiceRoleTestClient();
    const sourceId = randomUUID();

    const first = await service.from("xp_events").insert({
      user_id: userA.id,
      source_type: "flashcard_reviewed",
      source_id: sourceId,
      amount: 1,
    });
    expect(first.error).toBeNull();

    const second = await service.from("xp_events").insert({
      user_id: userA.id,
      source_type: "flashcard_reviewed",
      source_id: sourceId,
      amount: 1,
    });
    expect(second.error?.code).toBe(UNIQUE_VIOLATION);
  });

  it("rejects updates and deletes even from the service role (append-only trigger)", async () => {
    const service = createServiceRoleTestClient();
    const { data: event } = await service
      .from("xp_events")
      .insert({
        user_id: userA.id,
        source_type: "flashcard_reviewed",
        source_id: randomUUID(),
        amount: 1,
      })
      .select()
      .single();

    const updateResult = await service
      .from("xp_events")
      .update({ amount: 999 })
      .eq("id", event!.id);
    expect(updateResult.error).not.toBeNull();
  });
});
