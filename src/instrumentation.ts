/**
 * Next.js instrumentation hook — runs once when the server boots.
 * We validate required env vars here so misconfiguration fails fast at startup
 * with a clear message, rather than on the first request that needs them.
 *
 * Skipped during `next build` (no real secrets needed to compile) and on the
 * edge runtime (env access lives in the Node.js server modules).
 */
export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertRequiredEnv } = await import("@/lib/env");
  assertRequiredEnv();
}
