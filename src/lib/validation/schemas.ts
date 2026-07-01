import { z } from "zod";
import {
  MEDIA_TYPES,
  REACTIONS,
  REASON_TAGS,
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
