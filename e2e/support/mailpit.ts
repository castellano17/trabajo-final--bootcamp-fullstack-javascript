import { expect, type APIRequestContext } from "@playwright/test";

const mailpitApiUrl = `${process.env.MAILPIT_URL ?? "http://127.0.0.1:55324"}/api/v1`;

type MailpitSearchResult = { messages: { ID: string }[] };
type MailpitMessage = { HTML: string };

async function searchMessagesTo(request: APIRequestContext, recipient: string) {
  const response = await request.get(`${mailpitApiUrl}/search`, {
    params: { query: `to:"${recipient}"` },
  });
  const result = (await response.json()) as MailpitSearchResult;
  return result.messages;
}

export async function countEmailsTo(
  request: APIRequestContext,
  recipient: string,
) {
  return (await searchMessagesTo(request, recipient)).length;
}

export async function waitForEmailCount(
  request: APIRequestContext,
  recipient: string,
  expectedCount: number,
) {
  await expect
    .poll(() => countEmailsTo(request, recipient), { timeout: 15_000 })
    .toBe(expectedCount);
}

export async function latestEmailLinkTo(
  request: APIRequestContext,
  recipient: string,
) {
  await expect
    .poll(() => countEmailsTo(request, recipient), { timeout: 15_000 })
    .toBeGreaterThan(0);
  const [latestMessage] = await searchMessagesTo(request, recipient);
  const response = await request.get(
    `${mailpitApiUrl}/message/${latestMessage.ID}`,
  );
  const message = (await response.json()) as MailpitMessage;
  const link = message.HTML.match(/href="([^"]+)"/)?.[1];
  if (!link) {
    throw new Error(`No link found in the latest email to ${recipient}`);
  }
  return link.replaceAll("&amp;", "&");
}
