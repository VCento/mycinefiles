-- MyCinefiles — Sprint 2A
-- A title can be added to a given draft profile at most once. This backs the
-- `onConflict: "profile_id,title_id"` upsert in saveTitleReaction() so re-adding
-- a title UPDATES its reaction/reasons instead of inserting a duplicate row.
--
-- Idempotent-safe: guarded so re-running the migration is a no-op.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_title_reactions_profile_title_key'
  ) then
    alter table user_title_reactions
      add constraint user_title_reactions_profile_title_key
      unique (profile_id, title_id);
  end if;
end $$;
