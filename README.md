# Meridian — Sales Insights

Next.js 16 + Tailwind v4. Password-gated app to upload a Meridian pipeline CSV, explore insights, and share a snapshot via URL.

## Pages
| Route | What it does |
|---|---|
| `/login` | Shared-password gate (default `OPS123`) |
| `/` | Upload a CSV (parsed in-browser; kept in localStorage) |
| `/insights` | Revenue over time, rep performance, pipeline by stage, product mix, time-to-close table, win rate. **Share** button in the navbar |
| `/s/[id]` | Read-only shared snapshot, loaded from Supabase (still behind the password) |

## Run locally
```bash
npm install
cp .env.example .env.local   # optional locally; defaults to OPS123
npm run dev
```
Without Supabase env vars, **Share** falls back to `.data/` on disk in dev only.

## Supabase (for Share)
1. Project `meridian` (ref `osuxeebiedrlvdskcnne`) already has the table from [`supabase/schema.sql`](supabase/schema.sql).
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). Server-only — never `NEXT_PUBLIC_`.

## Deploy (GitHub → Vercel)
Import the repo in Vercel and set env vars: `APP_PASSWORD`, `SESSION_SECRET` (`openssl rand -base64 32`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Notes
- Auth is a single shared password → signed httpOnly cookie, enforced in `proxy.ts` for every page and API route.
- Snapshot IDs are 24-char random tokens; the table has RLS on with no policies, so only the server (service role) can access it.
- `assets/` holds the wireframe, branding reference and a sample CSV. Remove the CSV before making the repo public — it has customer names.
