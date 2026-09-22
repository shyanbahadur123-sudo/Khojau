# Khojau 🇳🇵 — Find Trusted Local Services Near You

Standalone Next.js + Supabase directory for Nepal. This folder is the entire project: no cross-project imports, no shared env, no shared DB.

## Quick start

1. Copy env: `cp .env.example .env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `ADMIN_EMAILS=founder@khojau.com`
2. In a **new dedicated Supabase project**, run `supabase/migrations/0001_init.sql`.
3. `npm install && npm run dev` → http://localhost:3000
4. Register → Add Business → Admin approves → public listing.

## Flows

- Customer: `/` → `/search?service=&location=` → `/provider/[slug]` → Call/Message/Directions
- Provider: `/register` → `/add-business` → pending → `/dashboard`
- Admin: `/admin` (allowlist via `ADMIN_EMAILS`) → approve/reject/verify/feature

## Scripts

- `npm run build` / `npm run typecheck` / `npm run lint`
- `node scripts/verify-isolation.mjs`

## Notes

- No fake providers, reviews, or stats anywhere.
- Analytics are first-party only (`events` table).
- Monetization is manual for MVP: admin sets `plan` to `featured`/`premium`.
