import "server-only";

import { z } from "zod";
import { TRAIT_KEYS } from "@/lib/ai/types";
import type { ProfileGenerationOutput } from "@/lib/ai/types";

/**
 * Robust parsing/validation of the AI's JSON response. Providers call
 * `parseProfileOutput` on the raw model text; on failure they retry ONCE with
 * a corrective nudge before giving up (see anthropic.ts).
 */

/** Thrown when the model response can't be parsed into a valid profile. */
export class AIOutputParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIOutputParseError";
  }
}

/** Every trait key required, each a 0–100 number. */
const traitsSchema = z.object(
  Object.fromEntries(
    TRAIT_KEYS.map((key) => [key, z.number().min(0).max(100)]),
  ) as Record<(typeof TRAIT_KEYS)[number], z.ZodNumber>,
);

const recommendationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(500),
  matchScore: z.number().min(0).max(100),
  category: z.string().trim().min(1).max(80),
});

/**
 * Bounded output schema. Unknown extra keys are STRIPPED (zod default), not
 * rejected — models occasionally add commentary fields and that shouldn't
 * fail the generation.
 */
const profileOutputSchema = z.object({
  archetype: z.string().trim().min(1).max(120),
  shortSummary: z.string().trim().min(1).max(600),
  deepSummary: z.string().trim().min(1).max(3000),
  shareQuote: z.string().trim().min(1).max(300),
  traits: traitsSchema,
  formula: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  strengths: z.array(z.string().trim().min(1).max(200)).min(1).max(6),
  blindSpots: z.array(z.string().trim().min(1).max(200)).min(1).max(6),
  recommendations: z.array(recommendationSchema).min(1).max(8),
  probablyNotForYou: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
});

/**
 * Strips markdown code fences and any prose around the JSON object: takes the
 * substring from the first `{` to the last `}`. Models wrapped in ```json
 * fences or with a leading sentence still parse.
 */
export function extractJsonCandidate(raw: string): string {
  const withoutFences = raw.replace(/```(?:json)?/gi, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return withoutFences.trim();
  return withoutFences.slice(start, end + 1).trim();
}

/**
 * Parses + validates the raw model text into a ProfileGenerationOutput.
 * Throws AIOutputParseError with a diagnostic (no user PII) on failure.
 */
export function parseProfileOutput(raw: string): ProfileGenerationOutput {
  const candidate = extractJsonCandidate(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new AIOutputParseError("response is not valid JSON");
  }

  const result = profileOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new AIOutputParseError(`schema validation failed: ${issues}`);
  }

  return result.data;
}
