import type {
  MediaType,
  Reaction,
  ReasonTag,
  DuelKey,
  Emotion,
} from "@/lib/titles/constants";

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

/**
 * The current draft's duel answers, keyed by duel key. Missing keys mean the
 * duel is still unanswered. Used to re-render selected state on load.
 */
export type DuelAnswers = Partial<Record<DuelKey, string>>;

/** A curated moment offered for a title in the moments step. */
export interface CuratedMoment {
  id: string;
  label: string;
  description: string | null;
}

/**
 * One positive-reaction title in the moments step: its metadata, any curated
 * moments offered for it, and the moment/emotion already saved (if any). The
 * moment is stored on the existing `user_title_reactions` row (2A created it).
 */
export interface MomentTitleItem {
  titleId: string;
  displayTitle: string;
  mediaType: MediaType;
  releaseYear: number | null;
  posterPath: string | null;
  reaction: Reaction;
  curatedMoments: CuratedMoment[];
  savedMomentId: string | null;
  savedFreeText: string | null;
  savedEmotion: Emotion | null;
}
