"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { requireUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import {
  searchTitleSchema,
  saveReactionSchema,
  removeReactionSchema,
} from "@/lib/validation/schemas";
import { searchMockTitles } from "@/lib/titles/mock";
import type { TitleSearchResult, SelectionItem } from "@/lib/titles/types";
import type { MediaType, Reaction, ReasonTag } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Sprint 2A — the first half of the creation flow. No AI, no TMDb. Every action
 * returns a typed ActionResult and never throws raw errors to the client.
 * `requireUser()` guards each action (redirects to /login if the session died).
 */

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return h.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** URL-safe ~10-char slug for `profiles.public_slug` (NOT NULL). */
function generatePublicSlug(): string {
  return randomBytes(8).toString("base64url").slice(0, 10);
}

interface DraftProfile {
  id: string;
  publicSlug: string;
  status: string;
}

/**
 * Returns the current user's canonical profile, creating one (status 'draft')
 * if none exists. `public_slug` is NOT NULL, so it is generated at creation
 * with a retry on the (extremely unlikely) unique collision.
 *
 * Since Sprint 3 the lookup is NOT filtered by status: once generation flips
 * the row to 'ready', later edits to titles/duels/moments keep attaching to
 * the SAME profile, so regeneration updates that row and the public slug
 * stays stable. Each user effectively has one profile (the earliest).
 *
 * Exported for reuse by the actions below; the routes themselves call the read
 * action (`getDraftSelection`) which lazily triggers creation "on demand".
 */
export async function ensureDraftProfile(): Promise<ActionResult<DraftProfile>> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("id, public_slug, status")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("[ensureDraftProfile] lookup error:", lookupError);
      return { ok: false, error: copy.errors.generic };
    }
    if (existing) {
      return {
        ok: true,
        data: {
          id: existing.id as string,
          publicSlug: existing.public_slug as string,
          status: existing.status as string,
        },
      };
    }

    // Create on demand. Retry only on a public_slug unique collision (23505).
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.userId,
          public_slug: generatePublicSlug(),
          status: "draft",
        })
        .select("id, public_slug, status")
        .single();

      if (!insertError && inserted) {
        return {
          ok: true,
          data: {
            id: inserted.id as string,
            publicSlug: inserted.public_slug as string,
            status: inserted.status as string,
          },
        };
      }

      // 23505 = unique_violation. A race could also create a profile for this
      // user concurrently; re-check before retrying with a fresh slug.
      if (insertError?.code === "23505") {
        const { data: raced } = await supabase
          .from("profiles")
          .select("id, public_slug, status")
          .eq("user_id", user.userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (raced) {
          return {
            ok: true,
            data: {
              id: raced.id as string,
              publicSlug: raced.public_slug as string,
              status: raced.status as string,
            },
          };
        }
        continue; // slug collision — try again with a new slug
      }

      console.error("[ensureDraftProfile] insert error:", insertError);
      return { ok: false, error: copy.errors.generic };
    }

    console.error("[ensureDraftProfile] exhausted slug attempts");
    return { ok: false, error: copy.errors.generic };
  } catch (error) {
    // requireUser() throws NEXT_REDIRECT on no session — let it propagate.
    if (isRedirectError(error)) throw error;
    console.error("[ensureDraftProfile] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** Maps a `titles` DB row (snake_case) to a TitleSearchResult (camelCase). */
function mapTitleRow(row: Record<string, unknown>): TitleSearchResult {
  return {
    tmdbId: (row.tmdb_id as string | null) ?? "",
    mediaType: row.media_type as MediaType,
    displayTitle: row.display_title as string,
    originalTitle: (row.original_title as string | null) ?? null,
    releaseYear: (row.release_year as number | null) ?? null,
    overview: (row.overview as string | null) ?? null,
    genres: Array.isArray(row.genres) ? (row.genres as string[]) : [],
    posterPath: (row.poster_path as string | null) ?? null,
    source: (row.source as string | null) ?? "tmdb",
  };
}

/**
 * Searches local `titles` first (ilike), then the curated MOCK list, then
 * merges + dedupes by `tmdbId|mediaType`. Local rows win (already persisted).
 *
 * Rate-limited (generous bucket so a debounced search box isn't throttled).
 *
 * FUTURE SEAM: a `searchTmdb(query)` will merge in here once TMDb lands —
 * insert its results into the same merge/dedupe map below. Do NOT implement
 * it this sprint.
 */
export async function searchTitles(
  input: unknown,
): Promise<ActionResult<TitleSearchResult[]>> {
  try {
    await requireUser();

    const ip = await getClientIp();
    // Generous limit: ~30/min so quick typing on a debounced box isn't blocked.
    const limit = checkRateLimit(`search:${ip}`, {
      capacity: 30,
      refillPerSecond: 30 / 60,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = searchTitleSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, error: first ?? copy.errors.validation };
    }
    const { query } = parsed.data;

    const merged = new Map<string, TitleSearchResult>();
    const keyOf = (t: TitleSearchResult) => `${t.tmdbId}|${t.mediaType}`;

    // 1) Local titles. Sanitize the term: commas/parens/% would break the
    //    PostgREST or() filter grammar, so collapse them to spaces.
    const safe = query.replace(/[,()%*\\]/g, " ").trim();
    if (safe) {
      const supabase = getSupabaseAdmin();
      const pattern = `%${safe}%`;
      const { data: rows, error } = await supabase
        .from("titles")
        .select(
          "id, tmdb_id, media_type, original_title, display_title, overview, release_year, genres, poster_path, source",
        )
        .or(`display_title.ilike.${pattern},original_title.ilike.${pattern}`)
        .limit(20);

      if (error) {
        console.error("[searchTitles] local lookup error:", error);
        // Non-fatal: still return mock results below.
      } else if (rows) {
        for (const row of rows) {
          const mapped = mapTitleRow(row as Record<string, unknown>);
          if (mapped.tmdbId) merged.set(keyOf(mapped), mapped);
        }
      }
    }

    // 2) Mock catalogue — only add if not already present from local.
    for (const mock of searchMockTitles(query)) {
      const key = keyOf(mock);
      if (!merged.has(key)) merged.set(key, mock);
    }

    return { ok: true, data: Array.from(merged.values()).slice(0, 30) };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[searchTitles] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

interface TitleEnsureInput {
  tmdbId: string;
  mediaType: MediaType;
  displayTitle: string;
  originalTitle: string | null;
  overview: string | null;
  releaseYear: number | null;
  genres: string[];
  posterPath: string | null;
  source: string;
}

/**
 * Ensures a title exists in `titles` (by tmdb_id + media_type) and returns its
 * id. Inserts it if absent. Does NOT touch AI / `title_analyses` (Sprint 3).
 */
async function ensureTitleExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  input: TitleEnsureInput,
): Promise<string> {
  const { data: existing, error: lookupError } = await supabase
    .from("titles")
    .select("id")
    .eq("tmdb_id", input.tmdbId)
    .eq("media_type", input.mediaType)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing.id as string;

  const { data: inserted, error: insertError } = await supabase
    .from("titles")
    .insert({
      tmdb_id: input.tmdbId,
      media_type: input.mediaType,
      display_title: input.displayTitle,
      original_title: input.originalTitle,
      overview: input.overview,
      release_year: input.releaseYear,
      genres: input.genres,
      // Until TMDb is the trusted metadata source, do not persist
      // client-supplied poster_path/source into the shared titles table.
      // poster_path is rendered as <img src> to OTHER users (searchTitles
      // reads this shared row), and source is clamped to a known-safe
      // constant rather than trusting client input.
      poster_path: null,
      source: "mock",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    // 23505 = a concurrent insert won the unique(tmdb_id, media_type) race.
    if (insertError?.code === "23505") {
      const { data: raced, error: reLookupError } = await supabase
        .from("titles")
        .select("id")
        .eq("tmdb_id", input.tmdbId)
        .eq("media_type", input.mediaType)
        .single();
      if (reLookupError || !raced) throw reLookupError ?? new Error("title race");
      return raced.id as string;
    }
    throw insertError ?? new Error("title insert failed");
  }

  return inserted.id as string;
}

/**
 * Persists the chosen title (inserting it if new) and upserts ONE
 * `user_title_reactions` row for (profile_id, title_id) with the reaction +
 * reason tags. Relies on migration 0002's `unique(profile_id, title_id)`.
 *
 * Does NOT write moment/emotion fields (selected_moment_id, free_text_moment,
 * interpreted_moment, emotion_tags) — those are Sprint 2B. The upsert only
 * touches the columns it sets, so on re-add those fields are left intact.
 */
export async function saveTitleReaction(
  input: unknown,
): Promise<ActionResult<{ titleId: string }>> {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    // Generous anti-spam bucket (~60/min): normal reacting never trips it.
    const limit = checkRateLimit(`reaction:${ip}`, {
      capacity: 60,
      refillPerSecond: 60 / 60,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = saveReactionSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, error: first ?? copy.errors.validation };
    }
    const { title, reaction, reasonTags } = parsed.data;

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();
    const titleId = await ensureTitleExists(supabase, title);

    const { error: upsertError } = await supabase
      .from("user_title_reactions")
      .upsert(
        {
          profile_id: draft.data.id,
          user_id: user.userId,
          title_id: titleId,
          reaction,
          reason_tags: reasonTags,
        },
        { onConflict: "profile_id,title_id" },
      );

    if (upsertError) {
      console.error("[saveTitleReaction] upsert error:", upsertError);
      return { ok: false, error: copy.errors.generic };
    }

    return { ok: true, data: { titleId } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[saveTitleReaction] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** One-to-one embed may arrive as object or single-element array. */
function unwrapEmbedded(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return value as Record<string, unknown>;
}

/**
 * Returns the current draft's reactions joined with their titles, ordered by
 * when they were added, for rendering the running selection.
 */
export async function getDraftSelection(): Promise<
  ActionResult<SelectionItem[]>
> {
  try {
    await requireUser();

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("user_title_reactions")
      .select(
        "title_id, reaction, reason_tags, created_at, titles ( id, tmdb_id, media_type, display_title, release_year, poster_path )",
      )
      .eq("profile_id", draft.data.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[getDraftSelection] select error:", error);
      return { ok: false, error: copy.errors.generic };
    }

    const items: SelectionItem[] = [];
    for (const row of rows ?? []) {
      const r = row as Record<string, unknown>;
      const title = unwrapEmbedded(r.titles);
      if (!title) continue; // title row missing (shouldn't happen) — skip
      items.push({
        titleId: r.title_id as string,
        tmdbId: (title.tmdb_id as string | null) ?? null,
        mediaType: title.media_type as MediaType,
        displayTitle: title.display_title as string,
        releaseYear: (title.release_year as number | null) ?? null,
        posterPath: (title.poster_path as string | null) ?? null,
        reaction: r.reaction as Reaction,
        reasonTags: Array.isArray(r.reason_tags)
          ? (r.reason_tags as ReasonTag[])
          : [],
      });
    }

    return { ok: true, data: items };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getDraftSelection] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** Removes one title's reaction from the current draft selection. */
export async function removeTitleReaction(
  input: unknown,
): Promise<ActionResult<{ titleId: string }>> {
  try {
    const user = await requireUser();

    const parsed = removeReactionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: copy.errors.validation };
    }
    const { titleId } = parsed.data;

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("user_title_reactions")
      .delete()
      .eq("profile_id", draft.data.id)
      .eq("user_id", user.userId)
      .eq("title_id", titleId);

    if (error) {
      console.error("[removeTitleReaction] delete error:", error);
      return { ok: false, error: copy.errors.generic };
    }

    return { ok: true, data: { titleId } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[removeTitleReaction] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * Next.js signals redirects by throwing a special error. requireUser() uses
 * redirect(), so we must re-throw it instead of swallowing it as a generic
 * failure inside our try/catch blocks.
 */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
