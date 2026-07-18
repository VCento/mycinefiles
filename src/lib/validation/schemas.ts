import { z } from "zod";
import {
  MEDIA_TYPES,
  REACTIONS,
  REASON_TAGS,
  EMOTIONS,
  findDuel,
} from "@/lib/titles/constants";

/**
 * Input validation schemas. `.strict()` rejects unknown fields so callers can't
 * smuggle extra data into a server action.
 */

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "El nombre visible es muy corto.")
      .max(40, "El nombre visible es muy largo."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "El usuario debe tener al menos 3 caracteres.")
      .max(24, "El usuario es muy largo.")
      .regex(
        /^[a-z0-9_]+$/,
        "Solo letras minúsculas, números y guion bajo.",
      ),
    password: z
      .string()
      .min(8, "La clave debe tener al menos 8 caracteres.")
      .max(72, "La clave es muy larga."), // bcrypt truncates beyond 72 bytes
  })
  .strict();

export const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).max(24),
    password: z.string().min(1).max(72),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/* -------------------------------------------------------------------------- */
/* Sprint 2A — title search + reactions                                       */
/* -------------------------------------------------------------------------- */

export const searchTitleSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, "Escribe algo para buscar.")
      .max(80, "La búsqueda es muy larga."),
  })
  .strict();

/**
 * A title chosen from search results. This is exactly what `searchTitles`
 * returns, so the client round-trips it back unchanged when persisting.
 * `tmdbId` + `mediaType` is the stable identity (matches the existing
 * `unique(tmdb_id, media_type)` constraint).
 */
export const titleInputSchema = z
  .object({
    tmdbId: z.string().trim().min(1).max(120),
    mediaType: z.enum(MEDIA_TYPES),
    displayTitle: z.string().trim().min(1).max(300),
    originalTitle: z.string().trim().max(300).nullable().default(null),
    overview: z.string().max(5000).nullable().default(null),
    releaseYear: z.number().int().min(1870).max(2100).nullable().default(null),
    genres: z.array(z.string().trim().max(60)).max(30).default([]),
    posterPath: z.string().trim().max(500).nullable().default(null),
    source: z.string().trim().max(40).default("mock"),
  })
  .strict();

export const saveReactionSchema = z
  .object({
    title: titleInputSchema,
    reaction: z.enum(REACTIONS),
    // Constrained to the curated list; out-of-list values are rejected.
    reasonTags: z.array(z.enum(REASON_TAGS)).max(REASON_TAGS.length).default([]),
  })
  .strict();

export const removeReactionSchema = z
  .object({
    titleId: z.string().uuid(),
  })
  .strict();

export type SearchTitleInput = z.infer<typeof searchTitleSchema>;
export type TitleInput = z.infer<typeof titleInputSchema>;
export type SaveReactionInput = z.infer<typeof saveReactionSchema>;
export type RemoveReactionInput = z.infer<typeof removeReactionSchema>;

/* -------------------------------------------------------------------------- */
/* Sprint 2B — duels + moments                                                */
/* -------------------------------------------------------------------------- */

/**
 * A single duel answer. Both the key and the chosen option are constrained to
 * the curated `DUELS` table: the option must be one of the two belonging to the
 * given duel, so a client can't smuggle an option from another duel.
 */
export const saveDuelSchema = z
  .object({
    duelKey: z.string().trim().min(1).max(60),
    selectedOption: z.string().trim().min(1).max(60),
  })
  .strict()
  .superRefine((val, ctx) => {
    const duel = findDuel(val.duelKey);
    if (!duel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duelo desconocido.",
        path: ["duelKey"],
      });
      return;
    }
    if (!(duel.options as readonly string[]).includes(val.selectedOption)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opción no válida para este duelo.",
        path: ["selectedOption"],
      });
    }
  });

/**
 * Marking a moment for a positive-reaction title. Exactly ONE of `momentId`
 * (a curated moment) or `freeTextMoment` (a typed sentence) must be present.
 * The free text is trimmed and length-clamped here; the action sanitizes it
 * further before persisting. Emotion is a single curated value.
 */
export const saveMomentSchema = z
  .object({
    titleId: z.string().uuid(),
    momentId: z.string().uuid().optional(),
    freeTextMoment: z
      .string()
      .trim()
      .min(3, "Cuéntanos un poco más.")
      .max(280, "Hazlo un poco más corto.")
      .optional(),
    emotion: z.enum(EMOTIONS),
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasMoment = typeof val.momentId === "string";
    const hasText =
      typeof val.freeTextMoment === "string" && val.freeTextMoment.length > 0;
    if (hasMoment === hasText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Elige un momento de la lista o escribe el tuyo.",
        path: ["freeTextMoment"],
      });
    }
  });

export type SaveDuelInput = z.infer<typeof saveDuelSchema>;
export type SaveMomentInput = z.infer<typeof saveMomentSchema>;

/* -------------------------------------------------------------------------- */
/* Sprint 4B — compare                                                        */
/* -------------------------------------------------------------------------- */

/**
 * public_slug shape from generatePublicSlug() (base64url). Lenient bounds.
 * Shared by the /compare route, the compare query, and the /me entry form.
 */
export const PUBLIC_SLUG_REGEX = /^[A-Za-z0-9_-]{4,32}$/;

/**
 * Raw input of the "Comparar" entry form on /me: a full card URL or a bare
 * slug. Slug extraction happens after this gate (see `@/lib/compare/slug`).
 */
export const compareEntrySchema = z
  .object({
    target: z
      .string()
      .trim()
      .min(1, "Pega un enlace o un código.")
      .max(300, "Eso es muy largo para ser un enlace de Cinefile."),
  })
  .strict();

export type CompareEntryInput = z.infer<typeof compareEntrySchema>;
