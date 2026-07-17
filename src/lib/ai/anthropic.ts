import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import {
  GENERATION_SYSTEM_PROMPT,
  buildGenerationPrompt,
  CORRECTIVE_NUDGE,
} from "@/lib/ai/prompts";
import { parseProfileOutput, AIOutputParseError } from "@/lib/ai/parse";
import type {
  ProfileGenerationInput,
  ProfileGenerationOutput,
} from "@/lib/ai/types";

/**
 * Real provider: Claude via @anthropic-ai/sdk. Server-only — the API key comes
 * from env exclusively, is never logged, and this module can never be bundled
 * client-side ("server-only" makes that a build error).
 *
 * ONE generation call does everything (moment interpretation included). If the
 * response fails to parse/validate, retry ONCE with a corrective nudge; a
 * second failure propagates AIOutputParseError for the action to map to a
 * friendly error.
 */

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

const MAX_OUTPUT_TOKENS = 4096;

/** Concatenates the text blocks of a response. */
function responseText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export async function generateAnthropicProfile(
  input: ProfileGenerationInput,
): Promise<ProfileGenerationOutput> {
  const client = getClient();
  const userPrompt = buildGenerationPrompt(input);

  const first = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const firstText = responseText(first);

  try {
    return parseProfileOutput(firstText);
  } catch (error) {
    if (!(error instanceof AIOutputParseError)) throw error;
    // Diagnostic only — no user PII, truncated model output for debugging.
    console.warn(
      "[ai/anthropic] first response invalid, retrying once:",
      error.message,
      "| head:",
      firstText.slice(0, 200),
    );
  }

  // Retry ONCE with a corrective nudge, keeping the failed turn as context.
  const second = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: userPrompt },
      { role: "assistant", content: firstText || "(respuesta vacía)" },
      { role: "user", content: CORRECTIVE_NUDGE },
    ],
  });

  // A second parse failure throws AIOutputParseError to the caller.
  return parseProfileOutput(responseText(second));
}
