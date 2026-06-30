"use server";

import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { getSession, clearSession, getCurrentUser } from "@/lib/auth/session";
import { hashSecret, verifySecret, DUMMY_HASH } from "@/lib/auth/password";
import { generateRecoveryCode } from "@/lib/auth/recoveryCode";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { registerSchema, loginSchema } from "@/lib/validation/schemas";
import { copy } from "@/lib/copy/es";

/**
 * Typed, serializable result for every server action. Actions never throw raw
 * errors to the client.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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

export interface RegisterResult {
  username: string;
  recoveryCode: string;
}

export async function registerUser(input: {
  displayName: string;
  username: string;
  password: string;
}): Promise<ActionResult<RegisterResult>> {
  try {
    const ip = await getClientIp();
    const limit = checkRateLimit(`register:${ip}`);
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message;
      return { ok: false, error: first ?? copy.errors.validation };
    }
    const { displayName, username, password } = parsed.data;

    const supabase = getSupabaseAdmin();

    // Pre-check for a clearer message; the DB unique constraint is the real guard.
    const { data: existing, error: lookupError } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) {
      console.error("[registerUser] lookup error:", lookupError);
      return { ok: false, error: copy.errors.generic };
    }
    if (existing) {
      return { ok: false, error: copy.errors.usernameTaken };
    }

    const recoveryCode = generateRecoveryCode();
    const [passwordHash, recoveryCodeHash] = await Promise.all([
      hashSecret(password),
      hashSecret(recoveryCode),
    ]);

    const { data: inserted, error: insertError } = await supabase
      .from("app_users")
      .insert({
        username,
        display_name: displayName,
        password_hash: passwordHash,
        recovery_code_hash: recoveryCodeHash,
      })
      .select("id, username")
      .single();

    if (insertError || !inserted) {
      // 23505 = unique_violation (race against the pre-check).
      if (insertError?.code === "23505") {
        return { ok: false, error: copy.errors.usernameTaken };
      }
      console.error("[registerUser] insert error:", insertError);
      return { ok: false, error: copy.errors.generic };
    }

    // Do NOT log the user in yet. Stash the new identity as "pending" so the
    // register-page guard does not redirect to /app before the one-time
    // recovery code has been shown and acknowledged. confirmRegistration()
    // promotes this to a real session when the user clicks "Ya lo guardé".
    const session = await getSession();
    session.pendingUserId = inserted.id as string;
    session.pendingUsername = inserted.username as string;
    await session.save();

    // Plaintext recovery code is returned here EXACTLY ONCE and never persisted.
    return {
      ok: true,
      data: { username: inserted.username as string, recoveryCode },
    };
  } catch (error) {
    console.error("[registerUser] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

/**
 * Promotes a pending registration (set by registerUser) into a real session.
 * Called ONLY when the user explicitly acknowledges they saved their recovery
 * code ("Ya lo guardé"). The identity comes from the encrypted pending session,
 * never from client input, so it cannot be forged.
 */
export async function confirmRegistration(): Promise<
  ActionResult<{ username: string }>
> {
  try {
    const session = await getSession();
    const pendingUserId = session.pendingUserId;
    const pendingUsername = session.pendingUsername;
    if (!pendingUserId || !pendingUsername) {
      return { ok: false, error: copy.errors.generic };
    }

    session.userId = pendingUserId;
    session.username = pendingUsername;
    delete session.pendingUserId;
    delete session.pendingUsername;
    await session.save();

    return { ok: true, data: { username: pendingUsername } };
  } catch (error) {
    console.error("[confirmRegistration] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

export async function loginUser(input: {
  username: string;
  password: string;
}): Promise<ActionResult<{ username: string }>> {
  try {
    const ip = await getClientIp();
    const limit = checkRateLimit(`login:${ip}`);
    if (!limit.allowed) {
      return { ok: false, error: copy.errors.rateLimited };
    }

    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      // Generic error — never reveal which field failed.
      return { ok: false, error: copy.errors.invalidCredentials };
    }
    const { username, password } = parsed.data;

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("[loginUser] lookup error:", error);
      return { ok: false, error: copy.errors.generic };
    }

    // Always run exactly one bcrypt compare — even when the user is absent —
    // against a dummy hash, so account existence cannot leak via timing.
    const passwordOk = await verifySecret(
      password,
      (user?.password_hash as string | undefined) ?? DUMMY_HASH,
    );
    if (!user || !passwordOk) {
      return { ok: false, error: copy.errors.invalidCredentials };
    }

    const session = await getSession();
    session.userId = user.id as string;
    session.username = user.username as string;
    await session.save();

    return { ok: true, data: { username: user.username as string } };
  } catch (error) {
    console.error("[loginUser] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

export async function logoutUser(): Promise<ActionResult> {
  try {
    await clearSession();
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[logoutUser] unexpected error:", error);
    return { ok: false, error: copy.errors.generic };
  }
}

export { getCurrentUser };
