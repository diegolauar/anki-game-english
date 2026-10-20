import { expect, test } from "@playwright/test";
import { signInViaMagicLink } from "./helpers";

const TEST_EMAIL = "e2e-conversation@example.com";
const USER_MESSAGES = [
  "Hello, I am learning English with this app.",
  "I work at a small company near my house.",
  "I like to read books on weekends.",
  "Thank you for helping me practice today.",
];

test("start a conversation, chat with the real AI, finish it, and see results", async ({
  page,
}) => {
  await signInViaMagicLink(page, TEST_EMAIL);

  await page.getByRole("link", { name: "Nova conversa" }).click();
  await page.waitForURL("**/conversations/new");

  await page.getByRole("button", { name: "Iniciar conversa" }).click();
  await page.waitForURL(/\/conversations\/[0-9a-f-]+$/);

  const input = page.getByPlaceholder("Escreva em inglês...");
  const sendButton = page.getByRole("button", { name: "Enviar" });

  for (const message of USER_MESSAGES) {
    await input.fill(message);
    await sendButton.click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(input).toBeEnabled({ timeout: 30_000 });
  }

  await page.getByRole("button", { name: "Finish conversation" }).click();
  await page.waitForURL(/\/conversations\/[0-9a-f-]+\/results$/, { timeout: 60_000 });

  await expect(page.getByRole("heading", { name: "Resultado da conversa" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Não foi possível analisar esta conversa" }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Transcrição" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/\d+ XP/)).toBeVisible();
});
