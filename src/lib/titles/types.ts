import type { MediaType, Reaction, ReasonTag } from "@/lib/titles/constants";

/**
 * Shape returned by `searchTitles` and consumed by the search UI. The
 * `tmdbId` + `mediaType` pair is the stable identifier used to persist the
 * title (matches the existing `unique(tmdb_id, media_type)` constraint).
 *
 * Client- and server-safe: no DB row internals, no secrets.
 */
export interface TitleSearchResult {
  tmdbId: string;
  mediaType: MediaType;
  displayTitle: string;
  originalTitle: string | null;
  releaseYear: number | null;
  overview: string | null;
  genres: string[];
  posterPath: string | null;
  source: string;
}

/**
 * One saved entry in the running selection: a `user_title_reactions` row
 * joined with its `titles` row, mapped to camelCase at the boundary.
 */
export interface SelectionItem {
  titleId: string;
  tmdbId: string | null;
  mediaType: MediaType;
  displayTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  reaction: Reaction;
  reasonTags: ReasonTag[];
}
