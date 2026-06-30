import "server-only";

import bcrypt from "bcryptjs";

/**
 * bcrypt cost factor. >= 10 per security requirements.
 */
const BCRYPT_COST = 12;

/**
 * A real cost-12 bcrypt hash of a throwaway string. NOT a secret (it's a hash).
 *
 * Used by the login path to run a bcrypt comparison even when no user exists,
 * so account existence cannot be inferred from response timing. Comparing
 * against this always fails for any real password, while keeping the work
 * (and thus latency) equivalent to the existing-user path.
 */
export const DUMMY_HASH =
  "$2b$12$31.605CzVrAbIqeq8RNY6OZ.M2RQ5Y8phfHuJIUhAU05Ynwd0pzgu";

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifySecret(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch (error) {
    console.error("[password] Error comparando hash:", error);
    return false;
  }
}
