import "server-only";

import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

/**
 * Session payload for an authenticated user. Holds ONLY non-sensitive
 * identifiers — never the password or any hash.
 */
export interface SessionData {
  userId: string;
  username: string;
}

/**
 * Shape actually persisted in the cookie.
 *
 * During registration the new user's identity is stashed under the `pending*`
 * fields instead of `userId`/`username`, so the account is NOT yet considered
 * logged in. This keeps the register-page guard from redirecting to /app before
 * the one-time recovery code has been shown and acknowledged. On confirmation
 * the pending identity is promoted to a real session. Still non-sensitive
 * identifiers only — never a password or hash.
 */
export interface StoredSession extends Partial<SessionData> {
  pendingUserId?: string;
  pendingUsername?: string;
}

export const SESSION_COOKIE_NAME = "mycinefiles_session";

/**
 * Built lazily so that importing this module never reads SESSION_SECRET — the
 * secret is only required when a request actually touches the session (not at
 * build time).
 */
function getSessionOptions() {
  return {
    password: env.SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

/**
 * Read the encrypted session cookie. Works in server components, server
 * actions and route handlers. Mutations (.save()/.destroy()) only persist when
 * called from a server action or route handler.
 */
export async function getSession(): Promise<IronSession<StoredSession>> {
  const cookieStore = await cookies();
  return getIronSession<StoredSession>(cookieStore, getSessionOptions());
}

/**
 * Returns the current user (from the session cookie) or null. Does not redirect.
 */
export async function getCurrentUser(): Promise<SessionData | null> {
  try {
    const session = await getSession();
    if (!session.userId || !session.username) return null;
    return { userId: session.userId, username: session.username };
  } catch (error) {
    console.error("[session] No se pudo leer la sesión:", error);
    return null;
  }
}

/**
 * Guards protected routes. Returns the user or redirects to /login.
 * Single reusable helper for /app/* and future /me, /create/*.
 */
export async function requireUser(): Promise<SessionData> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function clearSession(): Promise<void> {
  try {
    const session = await getSession();
    session.destroy();
  } catch (error) {
    console.error("[session] No se pudo limpiar la sesión:", error);
  }
}
