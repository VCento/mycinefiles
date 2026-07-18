-- MyCinefiles — Sprint 4A
-- Adds profiles.style_tags: 2-4 short Spanish "style claims" the AI coins for
-- the user (e.g. "Drama con nervio"), rendered as chips on the ShareCard and
-- on the public page (card-safe content). Existing rows get '[]' and render
-- chip-less — no backfill needed.
--
-- Idempotent: IF NOT EXISTS makes re-running a no-op.
-- MANUAL APPLY: run this in the Supabase SQL editor before testing 4A.

alter table profiles
  add column if not exists style_tags jsonb not null default '[]'::jsonb;
