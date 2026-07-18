import {
  compareEntrySchema,
  PUBLIC_SLUG_REGEX,
} from "@/lib/validation/schemas";

/**
 * Sprint 4B — slug extraction for the "Comparar" entry form on /me.
 *
 * SAFE for client and server (zod + regex only). Accepts either a full card
 * URL (any host, as long as the path contains /p/<slug>) or a bare slug, and
 * returns the validated slug — or null for anything else. Garbage never
 * navigates.
 */

/** /p/<slug> anywhere in a pasted URL or path. */
const CARD_PATH_PATTERN = /\/p\/([A-Za-z0-9_-]{4,32})(?:[/?#]|$)/;

export function extractCompareSlug(raw: string): string | null {
  const parsed = compareEntrySchema.safeParse({ target: raw });
  if (!parsed.success) return null;
  const value = parsed.data.target;

  // Full URL (or any path) that contains /p/<slug>.
  const match = CARD_PATH_PATTERN.exec(value);
  if (match) return match[1]!;

  // Bare slug, tolerating pasted trailing slash / query / hash.
  const bare = value.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return PUBLIC_SLUG_REGEX.test(bare) ? bare : null;
}
