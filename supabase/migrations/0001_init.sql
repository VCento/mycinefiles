-- MyCinefiles — initial schema (Sprint 1)
-- Full schema for the whole product. Tables beyond app_users/profiles are
-- created now but carry NO application logic this sprint.
-- Conventions: snake_case columns; RLS enabled, deny-by-default (server uses
-- the service role, which bypasses RLS).

create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  password_hash text not null,
  recovery_code_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  public_slug text unique not null,
  archetype text,
  short_summary text,
  deep_summary text,
  share_quote text,
  traits jsonb default '{}'::jsonb,
  formula jsonb default '[]'::jsonb,
  strengths jsonb default '[]'::jsonb,
  blind_spots jsonb default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists titles (
  id uuid primary key default gen_random_uuid(),
  tmdb_id text,
  imdb_id text,
  media_type text not null,
  original_title text,
  display_title text not null,
  overview text,
  release_year integer,
  original_language text,
  countries jsonb default '[]'::jsonb,
  genres jsonb default '[]'::jsonb,
  poster_path text,
  backdrop_path text,
  popularity numeric,
  source text default 'tmdb',
  raw_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tmdb_id, media_type)
);

create table if not exists title_analyses (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade,
  provider text,
  tone jsonb default '[]'::jsonb,
  themes jsonb default '[]'::jsonb,
  emotions jsonb default '[]'::jsonb,
  character_types jsonb default '[]'::jsonb,
  narrative_hooks jsonb default '[]'::jsonb,
  dimensions jsonb default '{}'::jsonb,
  cinefiles_reading text,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(title_id)
);

create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  title_id uuid references titles(id) on delete cascade,
  label text not null,
  description text,
  is_curated boolean default false,
  times_selected integer default 0,
  tags jsonb default '[]'::jsonb,
  emotions jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_title_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  title_id uuid references titles(id) on delete cascade,
  reaction text not null,
  reason_tags jsonb default '[]'::jsonb,
  emotion_tags jsonb default '[]'::jsonb,
  selected_moment_id uuid references moments(id) on delete set null,
  free_text_moment text,
  interpreted_moment jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists profile_duels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  duel_key text not null,
  selected_option text not null,
  created_at timestamptz default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  title_id uuid references titles(id) on delete set null,
  title_text text not null,
  reason text not null,
  match_score integer,
  category text,
  source text default 'ai',
  created_at timestamptz default now()
);

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid references profiles(id) on delete cascade,
  profile_b_id uuid references profiles(id) on delete cascade,
  public_slug text unique not null,
  compatibility_score integer,
  summary text,
  common_ground jsonb default '[]'::jsonb,
  friction_points jsonb default '[]'::jsonb,
  watch_together jsonb default '[]'::jsonb,
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS, deny-by-default (server uses service role).
alter table app_users enable row level security;
alter table profiles enable row level security;
alter table titles enable row level security;
alter table title_analyses enable row level security;
alter table moments enable row level security;
alter table user_title_reactions enable row level security;
alter table profile_duels enable row level security;
alter table recommendations enable row level security;
alter table comparisons enable row level security;

-- Service-role grants (reproducibility).
-- This project was created with "expose new tables" OFF, so newly created
-- tables receive NO automatic role grants. Our architecture is server-only:
-- all DB access goes through the service role (which also bypasses RLS).
-- Without these grants a fresh run of this migration leaves even the service
-- role unable to read/write — which is why a manual
-- `grant all ... to service_role` had to be run by hand in the SQL editor.
-- Granting here makes the migration self-contained and reproducible.
-- anon and authenticated are deliberately granted NOTHING; combined with the
-- RLS deny-by-default above, the public roles stay fully locked out.
-- grant is naturally idempotent, so this is safe to re-run.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
