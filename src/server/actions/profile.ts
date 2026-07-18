"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { requireUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { ensureDraftProfile } from "@/server/actions/titles";
import { getAIProvider } from "@/lib/ai/provider";
import { isPositiveReaction } from "@/lib/titles/constants";
import type { MediaType, Reaction } from "@/lib/titles/constants";
import type {
  ProfileGenerationInput,
  ProfileGenerationReaction,
} from "@/lib/ai/types";
import { copy } from "@/lib/copy/es";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Sprint 3 — Cinefile generation + profile reads.
 *
 * generateProfile() is the hero action: it loads EVERYTHING server-side from
 * the caller's own rows (never trusting a client payload), guards on minimum
 * material, rate-limits tightly (it's the expensive action), calls the AI
 * provider ONCE (moment interpretation happens inside that single call), and
 * persists the result to `profiles` + `recommendations`.
 *
 * `interpreted_moment` is deliberately never written (unused this sprint).
 * `probablyNotForYou` has no natural column and is NOT persisted (Sprint 4).
 */

/** Generation guard thresholds. */
const MIN_POSITIVE_REACTIONS = 3;
const MIN_REJECTIONS = 1;

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

/** The full private profile view for /me (and the dashboard mini-card). */
export interface CinefileView {
  displayName: string;
  publicSlug: string;
  status: string;
  archetype: string | null;
  shortSummary: string | null;
  deepSummary: string | null;
  shareQuote: string | null;
  styleTags: string[];
  traits: Record<string, number>;
  formula: string[];
  strengths: string[];
  blindSpots: string[];
}

/** Card-safe subset for the PUBLIC /p/[slug] page. Never more than this. */
export interface PublicCinefileView {
  displayName: string;
  publicSlug: string;
  archetype: string | null;
  shortSummary: string | null;
  shareQuote: string | null;
  styleTags: string[];
  traits: Record<string, number>;
}

/** One persisted recommendation, read-only for /me ("Para ti"). */
export interface RecommendationView {
  id: string;
  title: string;
  reason: string;
  matchScore: number | null;
  category: string | null;
}

/** What the generate page needs to render the summary + guard. */
export interface GenerationStatus {
  positives: number;
  rejections: number;
  duelsAnswered: number;
  momentsMarked: number;
  canGenerate: boolean;
  profileStatus: string;
}

/** One-to-one embed may arrive as object or single-element array. */
function unwrapEmbedded(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return value as Record<string, unknown>;
}

/** jsonb → string[] with junk filtered out. */
function jsonbStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** jsonb → Record<string, number> with junk filtered out. */
function jsonbNumberRecord(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  return out;
}

interface ReactionRow {
  reaction: Reaction;
  reasons: string[];
  emotions: string[];
  momentText: string | null;
  title: string;
  mediaType: MediaType;
  momentMarked: boolean;
}

/**
 * Loads the caller's reaction rows (with title + curated-moment label) for a
 * profile. Single source for both the guard counts and the generation input.
 */
async function loadReactionRows(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  profileId: string,
): Promise<ReactionRow[]> {
  const { data: rows, error } = await supabase
    .from("user_title_reactions")
    .select(
      "reaction, reason_tags, emotion_tags, free_text_moment, selected_moment_id, created_at, titles ( display_title, media_type ), moments ( label )",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const out: ReactionRow[] = [];
  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    const title = unwrapEmbedded(r.titles);
    if (!title) continue; // title row missing (shouldn't happen) — skip
    const curated = unwrapEmbedded(r.moments);
    const freeText = (r.free_text_moment as string | null) ?? null;
    const momentText = freeText ?? ((curated?.label as string | null) ?? null);
    out.push({
      reaction: r.reaction as Reaction,
      reasons: jsonbStringArray(r.reason_tags),
      emotions: jsonbStringArray(r.emotion_tags),
      momentText,
      title: title.display_title as string,
      mediaType: title.media_type as MediaType,
      momentMarked: momentText !== null,
    });
  }
  return out;
}

/**
 * Returns the material counts + guard verdict for the generate page.
 */
export async function getGenerationStatus(): Promise<
  ActionResult<GenerationStatus>
> {
  try {
    await requireUser();

    const profile = await ensureDraftProfile();
    if (!profile.ok) return profile;

    const supabase = getSupabaseAdmin();
    const reactions = await loadReactionRows(supabase, profile.data.id);

    const { count: duelsAnswered, error: duelsError } = await supabase
      .from("profile_duels")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.data.id);
    if (duelsError) throw duelsError;

    const positives = reactions.filter((r) => isPositiveReaction(r.reaction)).length;
    const rejections = reactions.length - positives;

    return {
      ok: true,
      data: {
        positives,
        rejections,
        duelsAnswered: duelsAnswered ?? 0,
        momentsMarked: reactions.filter((r) => r.momentMarked).length,
        canGenerate:
          positives >= MIN_POSITIVE_REACTIONS && rejections >= MIN_REJECTIONS,
        profileStatus: profile.data.status,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getGenerationStatus] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * THE hero action. Takes NO client input: everything is loaded from the
 * caller's own rows. Tightly rate-limited per user (3/hour) — this is the
 * expensive action. Regeneration updates the same profile row and REPLACES
 * its recommendations.
 */
export async function generateProfile(): Promise<ActionResult<CinefileView>> {
  try {
    const user = await requireUser();

    const profile = await ensureDraftProfile();
    if (!profile.ok) return profile;
    const profileId = profile.data.id;

    const supabase = getSupabaseAdmin();

    // Server-side material load — the client payload is never trusted here.
    const reactions = await loadReactionRows(supabase, profileId);
    const positives = reactions.filter((r) => isPositiveReaction(r.reaction));
    const rejections = reactions.length - positives.length;

    if (positives.length < MIN_POSITIVE_REACTIONS || rejections < MIN_REJECTIONS) {
      const missing: string[] = [];
      if (positives.length < MIN_POSITIVE_REACTIONS) {
        missing.push(copy.create.generate.guardPositives);
      }
      if (rejections < MIN_REJECTIONS) {
        missing.push(copy.create.generate.guardRejections);
      }
      return { ok: false, error: missing.join(" ") };
    }

    // Rate-limited AFTER the material guard so a guard-failing request never
    // burns generation budget (DEBT-008a) — but always BEFORE the AI call.
    // Per-user (not per-IP): the cost belongs to the account, and a shared IP
    // must not let one user exhaust another's budget.
    const limit = checkRateLimit(`generate:${user.userId}`, {
      capacity: 3,
      refillPerSecond: 3 / 3600,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.create.generate.rateLimited };
    }

    const { data: duelRows, error: duelsError } = await supabase
      .from("profile_duels")
      .select("duel_key, selected_option")
      .eq("profile_id", profileId);
    if (duelsError) {
      console.error("[generateProfile] duels load error:", duelsError);
      return { ok: false, error: copy.errors.generic };
    }

    const { data: userRow, error: userError } = await supabase
      .from("app_users")
      .select("display_name")
      .eq("id", user.userId)
      .single();
    if (userError || !userRow) {
      console.error("[generateProfile] user load error:", userError);
      return { ok: false, error: copy.errors.generic };
    }
    const displayName = userRow.display_name as string;

    const input: ProfileGenerationInput = {
      displayName,
      reactions: reactions.map(
        (r): ProfileGenerationReaction => ({
          title: r.title,
          mediaType: r.mediaType,
          reaction: r.reaction,
          reasons: r.reasons,
          emotions: r.emotions,
          momentText: r.momentText,
        }),
      ),
      duels: (duelRows ?? []).map((d) => {
        const row = d as Record<string, unknown>;
        return {
          duelKey: row.duel_key as string,
          selectedOption: row.selected_option as string,
        };
      }),
    };

    // ONE AI call (mock or Claude). Failures — including the post-retry parse
    // failure — become a clean, friendly error; the user's material is safe.
    const provider = getAIProvider();
    let output;
    try {
      output = await provider.generateProfile(input);
    } catch (error) {
      console.error(
        `[generateProfile] provider "${provider.name}" failed:`,
        error instanceof Error ? `${error.name}: ${error.message}` : error,
      );
      return { ok: false, error: copy.create.generate.failed };
    }

    // Persist the profile (same row on regeneration — slug stays stable).
    // NOTE: probablyNotForYou is intentionally NOT persisted (no column).
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        archetype: output.archetype,
        short_summary: output.shortSummary,
        deep_summary: output.deepSummary,
        share_quote: output.shareQuote,
        style_tags: output.styleTags,
        traits: output.traits,
        formula: output.formula,
        strengths: output.strengths,
        blind_spots: output.blindSpots,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[generateProfile] profile update error:", updateError);
      return { ok: false, error: copy.create.generate.failed };
    }

    // Replace recommendations (delete-then-insert keeps regeneration clean).
    const { error: deleteError } = await supabase
      .from("recommendations")
      .delete()
      .eq("profile_id", profileId);
    if (deleteError) {
      // Non-fatal: the profile itself is ready; log and continue.
      console.error("[generateProfile] recommendations delete error:", deleteError);
    } else {
      const { error: insertError } = await supabase.from("recommendations").insert(
        output.recommendations.map((rec) => ({
          profile_id: profileId,
          title_id: null,
          title_text: rec.title,
          reason: rec.reason,
          match_score: Math.round(rec.matchScore),
          category: rec.category,
          source: "ai",
        })),
      );
      if (insertError) {
        console.error("[generateProfile] recommendations insert error:", insertError);
      }
    }

    return {
      ok: true,
      data: {
        displayName,
        publicSlug: profile.data.publicSlug,
        status: "ready",
        archetype: output.archetype,
        shortSummary: output.shortSummary,
        deepSummary: output.deepSummary,
        shareQuote: output.shareQuote,
        styleTags: output.styleTags,
        traits: output.traits,
        formula: output.formula,
        strengths: output.strengths,
        blindSpots: output.blindSpots,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[generateProfile] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * The caller's own full profile for /me and the dashboard. Returns null data
 * when the user has no profile row yet.
 */
export async function getMyProfile(): Promise<ActionResult<CinefileView | null>> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from("profiles")
      .select(
        "public_slug, status, archetype, short_summary, deep_summary, share_quote, style_tags, traits, formula, strengths, blind_spots, app_users ( display_name )",
      )
      .eq("user_id", user.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[getMyProfile] select error:", error);
      return { ok: false, error: copy.errors.generic };
    }
    if (!row) return { ok: true, data: null };

    const r = row as Record<string, unknown>;
    const owner = unwrapEmbedded(r.app_users);

    return {
      ok: true,
      data: {
        displayName: (owner?.display_name as string | undefined) ?? user.username,
        publicSlug: r.public_slug as string,
        status: (r.status as string | null) ?? "draft",
        archetype: (r.archetype as string | null) ?? null,
        shortSummary: (r.short_summary as string | null) ?? null,
        deepSummary: (r.deep_summary as string | null) ?? null,
        shareQuote: (r.share_quote as string | null) ?? null,
        styleTags: jsonbStringArray(r.style_tags),
        traits: jsonbNumberRecord(r.traits),
        formula: jsonbStringArray(r.formula),
        strengths: jsonbStringArray(r.strengths),
        blindSpots: jsonbStringArray(r.blind_spots),
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getMyProfile] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** public_slug shape from generatePublicSlug() (base64url). Lenient bounds. */
const PUBLIC_SLUG_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;

/**
 * PUBLIC read for /p/[slug]: no auth. Returns ONLY card-safe fields via a
 * narrow selector — never deep_summary/formula/strengths/blind_spots, never
 * reactions or duels — and only for profiles with status='ready'. Draft
 * profiles are unreachable here by construction.
 */
export async function getPublicCinefile(
  slug: string,
): Promise<ActionResult<PublicCinefileView | null>> {
  try {
    if (typeof slug !== "string" || !PUBLIC_SLUG_PATTERN.test(slug)) {
      return { ok: true, data: null };
    }

    // Generous per-IP bucket (DEBT-008b): this is an unauthenticated endpoint;
    // normal sharing never trips ~60/min, scripted hammering does.
    const ip = await getClientIp();
    const limit = checkRateLimit(`public-profile:${ip}`, {
      capacity: 60,
      refillPerSecond: 1,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error } = await supabase
      .from("profiles")
      .select(
        "public_slug, archetype, short_summary, share_quote, style_tags, traits, app_users ( display_name )",
      )
      .eq("public_slug", slug)
      .eq("status", "ready")
      .maybeSingle();

    if (error) {
      console.error("[getPublicCinefile] select error:", error);
      return { ok: false, error: copy.errors.generic };
    }
    if (!row) return { ok: true, data: null };

    const r = row as Record<string, unknown>;
    const owner = unwrapEmbedded(r.app_users);

    return {
      ok: true,
      data: {
        displayName: (owner?.display_name as string | undefined) ?? "Cinéfile",
        publicSlug: r.public_slug as string,
        archetype: (r.archetype as string | null) ?? null,
        shortSummary: (r.short_summary as string | null) ?? null,
        shareQuote: (r.share_quote as string | null) ?? null,
        styleTags: jsonbStringArray(r.style_tags),
        traits: jsonbNumberRecord(r.traits),
      },
    };
  } catch (error) {
    console.error("[getPublicCinefile] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * The caller's persisted recommendations for /me ("Para ti"). Read-only — no
 * AI call here; rows were written by generateProfile. Best matches first.
 */
export async function getMyRecommendations(): Promise<
  ActionResult<RecommendationView[]>
> {
  try {
    const user = await requireUser();
    const supabase = getSupabaseAdmin();

    // Read-only profile lookup (never creates a row, unlike ensureDraftProfile).
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error("[getMyRecommendations] profile lookup error:", profileError);
      return { ok: false, error: copy.errors.generic };
    }
    if (!profileRow) return { ok: true, data: [] };

    const { data: rows, error } = await supabase
      .from("recommendations")
      .select("id, title_text, reason, match_score, category")
      .eq("profile_id", profileRow.id as string)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("[getMyRecommendations] select error:", error);
      return { ok: false, error: copy.errors.generic };
    }

    const items: RecommendationView[] = (rows ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        title: r.title_text as string,
        reason: r.reason as string,
        matchScore:
          typeof r.match_score === "number" ? (r.match_score as number) : null,
        category: (r.category as string | null) ?? null,
      };
    });

    return { ok: true, data: items };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getMyRecommendations] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** Re-throw Next.js redirect signals (from requireUser()) instead of swallowing. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
