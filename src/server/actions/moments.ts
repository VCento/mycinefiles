"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { requireUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { saveMomentSchema } from "@/lib/validation/schemas";
import { ensureDraftProfile } from "@/server/actions/titles";
import { POSITIVE_REACTIONS } from "@/lib/titles/constants";
import type {
  MediaType,
  Reaction,
  Emotion,
} from "@/lib/titles/constants";
import type {
  MomentTitleItem,
  CuratedMoment,
} from "@/lib/titles/types";
import { copy } from "@/lib/copy/es";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Sprint 2B — step 3 of the creation flow (mark the moments that hit). No AI.
 *
 * The moment/emotion is stored by UPDATING the existing `user_title_reactions`
 * row that Sprint 2A created for (profile_id, title_id). We never insert a
 * second reaction row, and we NEVER write `interpreted_moment` (Sprint-3 AI).
 *
 * `ensureDraftProfile` is imported from the titles actions (not duplicated).
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

/** One-to-one embed may arrive as object or single-element array. */
function unwrapEmbedded(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return value as Record<string, unknown>;
}

/**
 * Collapse whitespace and strip control characters from a free-text moment
 * before it is persisted. The zod schema already trimmed + length-clamped it;
 * this is defense-in-depth at the write boundary.
 */
function sanitizeFreeText(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    // Drop C0/C1 control characters (incl. DEL); keep everything else.
    out += code < 0x20 || code === 0x7f ? " " : ch;
  }
  return out.replace(/\s+/g, " ").trim().slice(0, 280);
}

/**
 * Returns the positive-reaction titles for the current draft, each with any
 * curated moments offered for it and the moment/emotion already saved.
 */
export async function getMomentsStep(): Promise<
  ActionResult<MomentTitleItem[]>
> {
  try {
    await requireUser();

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();

    // 1) Positive-reaction reactions joined to their titles.
    const { data: rows, error: reactionsError } = await supabase
      .from("user_title_reactions")
      .select(
        "title_id, reaction, emotion_tags, selected_moment_id, free_text_moment, created_at, titles ( display_title, media_type, release_year, poster_path )",
      )
      .eq("profile_id", draft.data.id)
      .in("reaction", POSITIVE_REACTIONS as unknown as string[])
      .order("created_at", { ascending: true });

    if (reactionsError) {
      console.error("[getMomentsStep] reactions error:", reactionsError);
      return { ok: false, error: copy.errors.generic };
    }

    const reactions = rows ?? [];
    const titleIds = reactions.map((r) => (r as Record<string, unknown>).title_id as string);

    // 2) Curated moments for those titles (single query, grouped in memory).
    const curatedByTitle = new Map<string, CuratedMoment[]>();
    if (titleIds.length > 0) {
      const { data: momentRows, error: momentsError } = await supabase
        .from("moments")
        .select("id, title_id, label, description")
        .in("title_id", titleIds)
        .eq("is_curated", true)
        .order("created_at", { ascending: true });

      if (momentsError) {
        console.error("[getMomentsStep] moments error:", momentsError);
        // Non-fatal: the free-text path still works with no curated moments.
      } else {
        for (const m of momentRows ?? []) {
          const row = m as Record<string, unknown>;
          const tid = row.title_id as string;
          const list = curatedByTitle.get(tid) ?? [];
          list.push({
            id: row.id as string,
            label: row.label as string,
            description: (row.description as string | null) ?? null,
          });
          curatedByTitle.set(tid, list);
        }
      }
    }

    const items: MomentTitleItem[] = [];
    for (const row of reactions) {
      const r = row as Record<string, unknown>;
      const title = unwrapEmbedded(r.titles);
      if (!title) continue; // title row missing (shouldn't happen) — skip
      const titleId = r.title_id as string;
      const emotionTags = Array.isArray(r.emotion_tags)
        ? (r.emotion_tags as string[])
        : [];
      items.push({
        titleId,
        displayTitle: title.display_title as string,
        mediaType: title.media_type as MediaType,
        releaseYear: (title.release_year as number | null) ?? null,
        posterPath: (title.poster_path as string | null) ?? null,
        reaction: r.reaction as Reaction,
        curatedMoments: curatedByTitle.get(titleId) ?? [],
        savedMomentId: (r.selected_moment_id as string | null) ?? null,
        savedFreeText: (r.free_text_moment as string | null) ?? null,
        savedEmotion: (emotionTags[0] as Emotion | undefined) ?? null,
      });
    }

    return { ok: true, data: items };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getMomentsStep] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * Persists a marked moment by UPDATING the existing positive-reaction row for
 * (profile_id, title_id): sets `selected_moment_id` (curated) OR
 * `free_text_moment` (typed) — clearing the other — plus `emotion_tags`.
 * Never touches `reaction`, `reason_tags`, or `interpreted_moment`.
 */
export async function saveMomentReaction(
  input: unknown,
): Promise<ActionResult<{ titleId: string }>> {
  try {
    await requireUser();

    const ip = await getClientIp();
    // Generous anti-spam bucket (~60/min): normal marking never trips it.
    const limit = checkRateLimit(`moment:${ip}`, {
      capacity: 60,
      refillPerSecond: 60 / 60,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = saveMomentSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, error: first ?? copy.errors.validation };
    }
    const { titleId, momentId, freeTextMoment, emotion } = parsed.data;

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();

    // If a curated moment was chosen, verify it actually belongs to this title
    // (and is curated) so a client can't attach an arbitrary moment id.
    if (momentId) {
      const { data: moment, error: momentLookupError } = await supabase
        .from("moments")
        .select("id")
        .eq("id", momentId)
        .eq("title_id", titleId)
        .eq("is_curated", true)
        .maybeSingle();
      if (momentLookupError) {
        console.error("[saveMomentReaction] moment lookup error:", momentLookupError);
        return { ok: false, error: copy.errors.generic };
      }
      if (!moment) {
        return { ok: false, error: copy.errors.validation };
      }
    }

    // Set exactly one moment source; clear the other. Leave interpreted_moment,
    // reaction and reason_tags untouched.
    const patch = momentId
      ? { selected_moment_id: momentId, free_text_moment: null }
      : {
          selected_moment_id: null,
          free_text_moment: sanitizeFreeText(freeTextMoment as string),
        };

    // Only update the EXISTING positive-reaction row for this draft+title.
    const { data: updated, error: updateError } = await supabase
      .from("user_title_reactions")
      .update({
        ...patch,
        emotion_tags: [emotion],
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", draft.data.id)
      .eq("title_id", titleId)
      .in("reaction", POSITIVE_REACTIONS as unknown as string[])
      .select("id");

    if (updateError) {
      console.error("[saveMomentReaction] update error:", updateError);
      return { ok: false, error: copy.errors.generic };
    }
    if (!updated || updated.length === 0) {
      // No positive-reaction row for this title in this draft.
      return { ok: false, error: copy.errors.validation };
    }

    return { ok: true, data: { titleId } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[saveMomentReaction] unexpected error:", error);
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
