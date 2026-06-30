# MyCinefiles — Tracked Technical Debt

Items deferred by design. Each is gated to a trigger — do NOT address out of scope.

- **[DEBT-001] Recovery-code entropy (~18.6 bits).** `src/lib/auth/recoveryCode.ts`.
  CSPRNG + bcrypt-hashed (safe at rest) but too low to resist brute force once a recovery
  endpoint exists. **Trigger:** before building the account-recovery flow.
  **Fix:** 3 words from a ≥40-word list + 4 digits (or CSPRNG alphanumerics), target ≥40 bits.

- **[DEBT-002] Rate limiter — spoofable IP + unbounded Map.** `src/lib/auth/rateLimit.ts`.
  Key derives from client-controlled `x-forwarded-for`; `buckets` Map never evicts.
  **Trigger:** multi-instance / production deploy.
  **Fix:** derive client IP from trusted-proxy config; durable store with TTL/size eviction.

- **[DEBT-003] `updated_at` never changes.** `supabase/migrations/0001_init.sql`.
  Defaults `now()` at insert, no BEFORE UPDATE trigger.
  **Trigger:** before any code reads `updated_at`.
  **Fix:** shared `set_updated_at()` trigger on tables with the column.

- **[DEBT-004] No ESLint config; `next lint` deprecated (Next 15.5).** `package.json`.
  **Trigger:** housekeeping, anytime.
  **Fix:** add `eslint.config.mjs` (flat config), switch script to ESLint CLI.

- **[DEBT-005] `pending*` session fields not cleared on login.** `src/server/actions/auth.ts`.
  `loginUser` leaves `pendingUserId`/`pendingUsername` if a register was abandoned then login
  happened. Not a vulnerability (pending is always self-owned) — incoherent-state smell.
  **Trigger:** next pass that touches the auth flow.
  **Fix:** `delete session.pending*` in `loginUser`; early-return in `confirmRegistration` if `userId` set.