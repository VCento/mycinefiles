import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

/**
 * GET /logout — clears the session cookie and redirects to the landing page.
 * Provided as a no-JS fallback alongside the client LogoutButton.
 */
export async function GET() {
  try {
    await clearSession();
  } catch (error) {
    console.error("[logout] error clearing session:", error);
  }
  return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL));
}
