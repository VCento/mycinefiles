/**
 * Canonical values for the title-reaction flow.
 *
 * SAFE for both client and server (no secrets, no server-only imports): the
 * client selectors render these and the server validation (zod) constrains to
 * them. The DB stores the snake_case-style string values directly; the Spanish
 * labels live in `@/lib/copy/es`.
 */

export const MEDIA_TYPES = ["movie", "tv", "documentary"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const REACTIONS = [
  "me_gusta",
  "me_encanta",
  "me_marco",
  "no_es_para_mi",
  "la_odio",
] as const;
export type Reaction = (typeof REACTIONS)[number];

/**
 * Positive reactions surface the reason selector; rejections may skip reasons.
 */
export const POSITIVE_REACTIONS = ["me_gusta", "me_encanta", "me_marco"] as const;

export function isPositiveReaction(reaction: string): boolean {
  return (POSITIVE_REACTIONS as readonly string[]).includes(reaction);
}

/**
 * Curated reason tags. Order here drives the order shown in the UI.
 */
export const REASON_TAGS = [
  "personajes",
  "historia",
  "tension",
  "humor",
  "estetica",
  "musica",
  "mundo",
  "romance",
  "oscuridad",
  "inteligencia",
  "nostalgia",
  "me_hizo_sentir",
  "me_atrapo",
] as const;
export type ReasonTag = (typeof REASON_TAGS)[number];
