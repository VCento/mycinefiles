import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * SECURITY: This module imports "server-only", so any attempt to bundle it into
 * a client component is a build-time error. The service role key bypasses RLS
 * and must never reach the browser. All DB access in this app goes through
 * server actions / route handlers that use this client.
 */

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  cachedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
