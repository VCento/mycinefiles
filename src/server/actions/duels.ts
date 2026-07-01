"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { requireUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { saveDuelSchema } from "@/lib/validation/schemas";
import { ensureDraftProfile } from "@/server/actions/titles";
import type { DuelAnswers } from "@/lib/titles/types";
import type { DuelKey } from "@/lib/titles/constants";
import { copy } from "@/lib/copy/es";
import type { ActionResult } from "@/server/actions/auth";

/**
 * Sprint 2B — step 2 of the creation flow (quick A/B duels). No AI. Every
 * action returns a typed ActionResult, guards with requireUser(), and re-throws
 * the NEXT_REDIRECT that requireUser() raises when the session is gone.
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

/**
 * Upserts one row per (profile_id, duel_key) so re-answering a duel UPDATES the
 * existing row instead of inserting a duplicate. Relies on migration 0003's
 * `unique(profile_id, duel_key)` constraint.
 */
export async function saveDuel(
  input: unknown,
): Promise<ActionResult<{ duelKey: string }>> {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    // Generous bucket (~60/min): normal duel answering never trips it.
    const limit = checkRateLimit(`duel:${ip}`, {
      capacity: 60,
      refillPerSecond: 60 / 60,
    });
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = saveDuelSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, error: first ?? copy.errors.validation };
    }
    const { duelKey, selectedOption } = parsed.data;

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();
    const { error: upsertError } = await supabase.from("profile_duels").upsert(
      {
        profile_id: draft.data.id,
        user_id: user.userId,
        duel_key: duelKey,
        selected_option: selectedOption,
      },
      { onConflict: "profile_id,duel_key" },
    );

    if (upsertError) {
      console.error("[saveDuel] upsert error:", upsertError);
      return { ok: false, error: copy.errors.generic };
    }

    return { ok: true, data: { duelKey } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[saveDuel] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/** Returns the current draft's duel answers keyed by duel_key. */
export async function getDuels(): Promise<ActionResult<DuelAnswers>> {
  try {
    await requireUser();

    const draft = await ensureDraftProfile();
    if (!draft.ok) return draft;

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("profile_duels")
      .select("duel_key, selected_option")
      .eq("profile_id", draft.data.id);

    if (error) {
      console.error("[getDuels] select error:", error);
      return { ok: false, error: copy.errors.generic };
    }

    const answers: DuelAnswers = {};
    for (const row of rows ?? []) {
      const r = row as Record<string, unknown>;
      answers[r.duel_key as DuelKey] = r.selected_option as string;
    }

    return { ok: true, data: answers };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[getDuels] unexpected error:", error);
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
