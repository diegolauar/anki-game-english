import type { Page } from "@playwright/test";

const MAILPIT_URL = "http://127.0.0.1:54324";

interface MailpitMessageSummary {
  ID: string;
  To: { Address: string }[];
}

interface MailpitMessageDetail {
  Text: string;
  HTML: string;
}

export async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

async function waitForMagicLink(email: string, timeoutMs = 20_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data: { messages: MailpitMessageSummary[] } = await response.json();
    const match = data.messages.find((message) => message.To.some((to) => to.Address === email));

    if (match) {
      const detailResponse = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      const detail: MailpitMessageDetail = await detailResponse.json();
      const body = detail.Text || detail.HTML;
      const linkMatch = body.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s"<]+/);
      if (linkMatch) return linkMatch[0].replace(/&amp;/g, "&");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Magic link email to ${email} not found within ${timeoutMs}ms.`);
}

export async function signInViaMagicLink(page: Page, email: string): Promise<void> {
  await clearMailpit();

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  await page.getByText("Link enviado!").waitFor();

  const magicLink = await waitForMagicLink(email);
  await page.goto(magicLink);
  await page.waitForURL("**/dashboard");
}
