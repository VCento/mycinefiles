# MyCinefiles

Mobile-first web app where you build a cultural-emotional profile from the films,
series, documentaries and scenes you love — then generate **tu Cinefile** and
compare it with others.

This repo currently contains **Sprint 1**: project scaffold, full DB schema,
custom (email-less) auth, and the public landing + auth surfaces.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase Postgres (server-side, service-role key only)
- iron-session (encrypted HTTP-only session cookie)
- bcryptjs (password + recovery-code hashing)
- zod (input validation)

## Getting started

```bash
npm install
cp .env.example .env        # then fill in the required vars
npm run dev                 # http://localhost:3000
```

### Required environment variables

The app fails fast on startup if any of these are missing:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET` (≥ 32 chars; generate with `openssl rand -base64 32`)

`TMDB_API_KEY` and the `ANTHROPIC_*` / `AI_PROVIDER` vars are placeholders for
later sprints and may be left empty.

### Database

Apply the schema to your Supabase project:

```bash
# via Supabase CLI
supabase db push

# or paste supabase/migrations/0001_init.sql into the SQL editor
```

RLS is enabled on every table with **no public policies** (deny-by-default).
All access goes through server actions using the service-role key.

## What works this sprint

Land on `/` → register with username + password → receive a one-time recovery
code → log in → see an empty private dashboard at `/app` → log out.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript, no emit
- `npm run lint` — Next.js lint
