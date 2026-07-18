import type { MediaType, Reaction } from "@/lib/titles/constants";

/**
 * Types for the AI profile-generation boundary (Sprint 3).
 *
 * SAFE for both client and server (no secrets, no server-only imports): the
 * ShareCard and result screens render trait keys, and the server providers
 * produce/validate these shapes. Providers themselves ARE server-only.
 */

/**
 * The 13 trait dimensions of a Cinefile, scored 0–100 by the AI. Stable
 * snake_case keys stored in `profiles.traits` (jsonb); Spanish labels live in
 * `@/lib/copy/es`. Order here drives the order shown in the UI.
 */
export const TRAIT_KEYS = [
  "intensidad_emocional",
  "tolerancia_oscuridad",
  "humor",
  "romanticismo",
  "fantasia",
  "realismo",
  "complejidad_narrativa",
  "nostalgia",
  "adrenalina",
  "sensibilidad_estetica",
  "curiosidad_intelectual",
  "calidez",
  "apertura_incomodidad",
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

export type TraitScores = Record<TraitKey, number>;

/** One reacted title, flattened for the generation prompt. */
export interface ProfileGenerationReaction {
  title: string;
  mediaType: MediaType;
  reaction: Reaction;
  /** Curated reason tags chosen for this title (may be empty). */
  reasons: string[];
  /** Emotions attached to the marked moment (may be empty). */
  emotions: string[];
  /**
   * The moment that hit: the curated moment's label or the user's raw free
   * text. Interpretation happens INSIDE the single generation call — there is
   * no separate interpretation step by design (economy).
   */
  momentText: string | null;
}

/** One answered duel. */
export interface ProfileGenerationDuel {
  duelKey: string;
  selectedOption: string;
}

/**
 * Everything the AI receives. Assembled SERVER-SIDE from the caller's own
 * draft rows — never from a client payload.
 */
export interface ProfileGenerationInput {
  displayName: string;
  reactions: ProfileGenerationReaction[];
  duels: ProfileGenerationDuel[];
}

/** One recommendation produced by the generation call. */
export interface ProfileRecommendation {
  title: string;
  reason: string;
  /** 0–100 affinity score. */
  matchScore: number;
  category: string;
}

/**
 * The generated Cinefile. All text in Spanish; tone smart/warm/subtly funny,
 * never clinical. Persisted to `profiles` (+ `recommendations`), except
 * `probablyNotForYou`, which has no natural column this sprint and is NOT
 * persisted (kept in the type for Sprint 4).
 */
export interface ProfileGenerationOutput {
  archetype: string;
  shortSummary: string;
  deepSummary: string;
  shareQuote: string;
  /**
   * 2-4 short Spanish style claims coined for this user — personality-flavored
   * genre claims ("Drama con nervio"), not plain genres. Card-safe: rendered
   * as chips on the ShareCard and the public page.
   */
  styleTags: string[];
  traits: TraitScores;
  formula: string[];
  strengths: string[];
  blindSpots: string[];
  recommendations: ProfileRecommendation[];
  probablyNotForYou: string[];
}
