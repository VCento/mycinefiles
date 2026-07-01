-- MyCinefiles — Sprint 2B
-- Two things, all idempotent-safe (re-running is a no-op):
--
-- 1) A unique(profile_id, duel_key) constraint on profile_duels. This backs the
--    `onConflict: "profile_id,duel_key"` upsert in saveDuel() so re-answering a
--    duel UPDATES its row instead of inserting a duplicate.
--
-- 2) Curated moments for a handful of mock titles. Curated moments reference
--    titles.id, but mock titles only enter `titles` when a user reacts to them.
--    Rather than couple the seed to user activity, we SEED THE MOCK TITLE ROWS
--    here first — using the exact same identity the app uses
--    (tmdb_id = 'mock_<slug>' + media_type, deduped by the existing
--    unique(tmdb_id, media_type)). ensureTitleExists() will then find and reuse
--    these rows on first reaction instead of inserting new ones. Moments are
--    then attached by looking those title rows up. The free-text moment path in
--    the app works regardless of whether this seed ran.
--
-- MANUAL APPLY: run this in the Supabase SQL editor before testing 2B.

-- 1) profile_duels uniqueness ------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_duels_profile_duel_key'
  ) then
    alter table profile_duels
      add constraint profile_duels_profile_duel_key
      unique (profile_id, duel_key);
  end if;
end $$;

-- 2a) Seed the mock title rows the curated moments hang off of ---------------
-- tmdb_id/media_type mirror src/lib/titles/mock.ts (slugify of display_title),
-- so the app dedupes naturally on first reaction. ON CONFLICT keeps this a
-- no-op on re-run and never clobbers a title a user already inserted.
insert into titles (tmdb_id, media_type, display_title, original_title, overview, release_year, genres, source)
values
  ('mock_whiplash',     'movie', 'Whiplash',     null,     'Un baterista y un mentor brutal llevan la obsesión al límite.',        2014, '["Drama","Música"]'::jsonb,                    'mock'),
  ('mock_her',          'movie', 'Her',          null,     'Un hombre solitario se enamora de una inteligencia artificial.',       2013, '["Drama","Romance","Ciencia ficción"]'::jsonb, 'mock'),
  ('mock_parasitos',    'movie', 'Parásitos',    '기생충', 'Una familia pobre se infiltra en la vida de una familia rica.',        2019, '["Drama","Thriller"]'::jsonb,                  'mock'),
  ('mock_breaking-bad', 'tv',    'Breaking Bad', null,     'Un profesor de química se convierte en capo de la metanfetamina.',     2008, '["Drama","Crimen","Thriller"]'::jsonb,         'mock'),
  ('mock_succession',   'tv',    'Succession',   null,     'Una familia multimillonaria se devora por el control del imperio.',    2018, '["Drama"]'::jsonb,                             'mock'),
  ('mock_the-bear',     'tv',    'The Bear',     null,     'Un chef de alta cocina hereda el caótico local de su hermano.',        2022, '["Drama","Comedia"]'::jsonb,                   'mock')
on conflict (tmdb_id, media_type) do nothing;

-- 2b) Attach curated moments -------------------------------------------------
-- Each row inserts only if a curated moment with the same (title_id, label)
-- doesn't already exist, so the whole block is safe to re-run. If a title row
-- is somehow absent the SELECT yields nothing and that moment is simply skipped.
do $$
declare
  seed record;
  tid uuid;
begin
  for seed in
    select * from (values
      ('mock_whiplash',     'movie', 'El tempo final',                'El solo de batería que lo cambia todo.'),
      ('mock_whiplash',     'movie', '«Not quite my tempo»',          'La primera humillación en el ensayo.'),
      ('mock_whiplash',     'movie', 'La silla que vuela',            'Cuando la tensión estalla en el aula.'),
      ('mock_her',          'movie', 'La primera conversación',       'El momento en que Samantha cobra vida.'),
      ('mock_her',          'movie', 'La cita doble',                 'El amor se vuelve incómodamente real.'),
      ('mock_her',          'movie', 'El adiós',                      'Las IA se despiden y todo cambia.'),
      ('mock_parasitos',    'movie', 'La inundación',                 'La casa de abajo se hunde en el agua.'),
      ('mock_parasitos',    'movie', 'La fiesta en el jardín',        'Todo se desborda a plena luz del día.'),
      ('mock_parasitos',    'movie', 'El olor',                       'La línea invisible entre las clases.'),
      ('mock_breaking-bad', 'tv',    '«I am the one who knocks»',     'Walter marca su territorio.'),
      ('mock_breaking-bad', 'tv',    '«Say my name»',                 'El nombre que impone respeto.'),
      ('mock_breaking-bad', 'tv',    'La pizza en el techo',          'La grieta que se abre en casa.'),
      ('mock_succession',   'tv',    '«L to the OG»',                 'El rap más incómodo de la historia.'),
      ('mock_succession',   'tv',    'El brindis del cierre',         'Un discurso que enfría la sala entera.'),
      ('mock_succession',   'tv',    'La decisión del bote',          'Una elección que lo parte todo.'),
      ('mock_the-bear',     'tv',    '«Yes, chef»',                   'La cocina por fin encuentra su ritmo.'),
      ('mock_the-bear',     'tv',    'El episodio en tiempo real',    'Todo en una sola toma, sin respiro.'),
      ('mock_the-bear',     'tv',    'La lata de tomate',             'El caos que casi los rompe a todos.')
    ) as v(tmdb_id, media_type, label, description)
  loop
    select id into tid
    from titles
    where tmdb_id = seed.tmdb_id and media_type = seed.media_type
    limit 1;

    if tid is not null and not exists (
      select 1 from moments m
      where m.title_id = tid and m.label = seed.label and m.is_curated = true
    ) then
      insert into moments (title_id, label, description, is_curated)
      values (tid, seed.label, seed.description, true);
    end if;
  end loop;
end $$;
