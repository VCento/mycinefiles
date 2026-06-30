import "server-only";

/**
 * Centralized, validated environment access.
 *
 * Required vars are validated on first access and fail fast with a clear
 * message. AI / TMDb vars are intentionally optional this sprint — the app
 * must boot and run with them absent.
 */

type RequiredKey =
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SESSION_SECRET";

function readRequired(key: RequiredKey, minLength = 1): string {
  const value = process.env[key];
  if (!value || value.trim().length < minLength) {
    throw new Error(
      `[env] Falta la variable de entorno requerida "${key}". ` +
        `Copia .env.example a .env y complétala antes de arrancar la app.`,
    );
  }
  return value;
}

function readOptional(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

/**
 * iron-session requires a password of at least 32 characters. We surface that
 * requirement here rather than letting iron-session throw a cryptic error.
 */
const SESSION_SECRET_MIN_LENGTH = 32;

export const env = {
  // Public (safe for the browser) — read directly so Next can inline them.
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Required, server-only.
  get SUPABASE_URL() {
    return readRequired("SUPABASE_URL");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return readRequired("SUPABASE_SERVICE_ROLE_KEY");
  },
  get SESSION_SECRET() {
    return readRequired("SESSION_SECRET", SESSION_SECRET_MIN_LENGTH);
  },

  // Optional now, used in later sprints.
  SUPABASE_ANON_KEY: readOptional("SUPABASE_ANON_KEY"),
  TMDB_API_KEY: readOptional("TMDB_API_KEY"),
  AI_PROVIDER: readOptional("AI_PROVIDER") ?? "mock",
  ANTHROPIC_API_KEY: readOptional("ANTHROPIC_API_KEY"),
  ANTHROPIC_MODEL: readOptional("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001",
} as const;

/**
 * Eagerly assert the required vars exist. Call from a server entry point to
 * fail fast on misconfiguration instead of on the first request that needs it.
 */
export function assertRequiredEnv(): void {
  try {
    void env.SUPABASE_URL;
    void env.SUPABASE_SERVICE_ROLE_KEY;
    void env.SESSION_SECRET;
  } catch (error) {
    console.error("[env] Configuración inválida:", error);
    throw error;
  }
}
