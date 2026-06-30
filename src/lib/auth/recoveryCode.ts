import "server-only";

import { randomInt } from "node:crypto";

/**
 * Curated Spanish word list for human-friendly recovery codes.
 * Format: CINE-<WORD>-<WORD>-<NNN>  e.g. CINE-LUNA-NIEBLA-042
 */
const WORDS: readonly string[] = [
  "LUNA",
  "ROJO",
  "NIEBLA",
  "FUEGO",
  "NORTE",
  "SOMBRA",
  "OCASO",
  "MAREA",
  "CIELO",
  "BOSQUE",
  "ECLIPSE",
  "AURORA",
  "TORMENTA",
  "DESIERTO",
  "ABISMO",
  "FARO",
  "VERANO",
  "INVIERNO",
  "ESTRELLA",
  "RELAMPAGO",
];

/**
 * Generates a one-time recovery code using a CSPRNG (crypto.randomInt).
 * The plaintext is shown to the user exactly once; only its hash is stored.
 */
export function generateRecoveryCode(): string {
  const first = WORDS[randomInt(WORDS.length)];
  const second = WORDS[randomInt(WORDS.length)];
  const digits = String(randomInt(0, 1000)).padStart(3, "0");
  return `CINE-${first}-${second}-${digits}`;
}
