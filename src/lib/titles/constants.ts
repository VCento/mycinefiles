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

/* -------------------------------------------------------------------------- */
/* Sprint 2B — duels + moment emotions                                        */
/* -------------------------------------------------------------------------- */

/**
 * The 7 fixed duels. `key` is the stable snake_case identity stored in
 * `profile_duels.duel_key`; `options` are the two stable snake_case values one
 * of which is stored in `selected_option`. Spanish labels live in
 * `@/lib/copy/es`. Order here drives the order shown in the UI.
 */
export const DUELS = [
  { key: "tension_vs_humor", options: ["tension", "humor"] },
  { key: "happy_vs_impactful", options: ["final_feliz", "final_impactante"] },
  { key: "realism_vs_fantasy", options: ["realismo", "fantasia"] },
  { key: "good_vs_complex", options: ["personajes_buenos", "personajes_complejos"] },
  { key: "light_vs_intense", options: ["liviano", "intenso"] },
  { key: "simple_vs_thinky", options: ["historia_simple", "historia_pensar"] },
  { key: "warmth_vs_darkness", options: ["calidez", "oscuridad_elegante"] },
] as const;

export type DuelKey = (typeof DUELS)[number]["key"];
export type DuelOption = (typeof DUELS)[number]["options"][number];

/** Lookup a duel definition by its key. */
export function findDuel(key: string): (typeof DUELS)[number] | undefined {
  return DUELS.find((d) => d.key === key);
}

/**
 * Curated single-choice emotions attached to a marked moment. Stored (as a
 * one-element array) in `user_title_reactions.emotion_tags`. Order drives UI.
 */
export const EMOTIONS = [
  "adrenalina",
  "angustia",
  "motivacion",
  "incomodidad",
  "fascinacion",
  "tristeza",
  "euforia",
  "rabia",
  "nostalgia",
  "ternura",
  "paz",
  "vacio",
  "esperanza",
] as const;
export type Emotion = (typeof EMOTIONS)[number];
