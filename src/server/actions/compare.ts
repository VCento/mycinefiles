"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { POSITIVE_REACTIONS } from "@/lib/titles/constants";
import { PUBLIC_SLUG_REGEX } from "@/lib/validation/schemas";
import { copy } from "@/lib/copy/es";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Sprint 4B — the dedicated PUBLIC read for /compare/[slugA]/[slugB].
 *
 * Deliberately does NOT widen getPublicCinefile: this query is narrower still.
 * Exposed fields per profile are EXACTLY: display_name, public_slug,
 * archetype, style_tags, traits, plus the display names of positive-reaction
 * titles (the one comparison-only addition). NO short_summary, share_quote,
 * reasons, moments, duels, or recommendations — the compare layout doesn't
 * render them, so the query never fetches them.
 */

/** Comparison-safe view of one profile. Never more than this. */
export interface CompareProfileView {
  displayName: string;
  publicSlug: string;
  archetype: string | null;
  styleTags: string[];
  traits: Record<string, number>;
  /** Display names of positively-reacted titles, for overlap only. */
  positiveTitles: string[];
}

export interface ComparePairView {
  a: CompareProfileView;
  b: CompareProfileView;
}

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

/** Generous cap: nobody's comparison needs more titles than this. */
const MAX_POSITIVE_TITLES = 200;

/**
 * One profile by slug (status='ready' only) + its positive-title names.
 * Returns null for unknown/draft slugs. The internal row id is used only to
 * join reactions and is never part of the view.
 */
async function loadCompareProfile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  slug: string,
): Promise<CompareProfileView | null> {
  const { data: row, error } = await supabase
    .from("profiles")
    .select(
      "id, public_slug, archetype, style_tags, traits, app_users ( display_name )",
    )
    .eq("public_slug", slug)
    .eq("status", "ready")
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const r = row as Record<string, unknown>;
  const owner = unwrapEmbedded(r.app_users);

  const { data: reactionRows, error: reactionsError } = await supabase
    .from("user_title_reactions")
    .select("titles ( display_title )")
    .eq("profile_id", r.id as string)
    .in("reaction", [...POSITIVE_REACTIONS])
    .limit(MAX_POSITIVE_TITLES);

  if (reactionsError) throw reactionsError;

  const positiveTitles: string[] = [];
  for (const reactionRow of reactionRows ?? []) {
    const title = unwrapEmbedded(
      (reactionRow as Record<string, unknown>).titles,
    );
    const name = title?.display_title;
    if (typeof name === "string" && name.trim().length > 0) {
      positiveTitles.push(name);
    }
  }

  return {
    displayName: (owner?.display_name as string | undefined) ?? "Cinéfile",
    publicSlug: r.public_slug as string,
    archetype: (r.archetype as string | null) ?? null,
    styleTags: jsonbStringArray(r.style_tags),
    traits: jsonbNumberRecord(r.traits),
    positiveTitles,
  };
}

/**
 * PUBLIC read for /compare: no auth. Both slugs pre-validated, both profiles
 * must be status='ready' — anything else is a friendly null (never an error
 * with details). Order is preserved: data.a is slugA, data.b is slugB.
 */
export async function getComparePair(
  slugA: string,
  slugB: string,
): Promise<ActionResult<ComparePairView | null>> {
  try {
    if (
      typeof slugA !== "string" ||
      typeof slugB !== "string" ||
      !PUBLIC_SLUG_REGEX.test(slugA) ||
      !PUBLIC_SLUG_REGEX.test(slugB)
    ) {
      return { ok: true, data: null };
    }

    // House pattern for unauthenticated surfaces: generous per-IP bucket —
    // normal sharing never trips ~60/min, scripted hammering does.
    const ip = await getClientIp();
    const limit = checkRateLimit(`compare:${ip}`, {
      capacity: 60,
      refillPerSecond: 1,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const supabase = getSupabaseAdmin();
    const [a, b] = await Promise.all([
      loadCompareProfile(supabase, slugA),
      loadCompareProfile(supabase, slugB),
    ]);

    if (!a || !b) return { ok: true, data: null };
    return { ok: true, data: { a, b } };
  } catch (error) {
    console.error("[getComparePair] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}
