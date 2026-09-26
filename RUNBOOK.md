# Khojau Operations Runbook (K-10)

Local service finder for Nepal. Next.js 14.2 / React 18 / Supabase
(Auth + Postgres + Storage + RLS) / Vercel. Production:
https://khojau-seven.vercel.app

## 1. Environment variables

Copy `.env.example` to `.env.local`. Reference:

| Var | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Single source of truth; CSP derives from it |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | NEVER `NEXT_PUBLIC_`, never commit |
| `ADMIN_EMAILS` | server-only | Comma-separated owner emails |
| `ADMIN_REQUIRE_MFA` | server-only | Set `true` only after MFA enrolled (K-03) |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for sitemap/redirects |

## 2. Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

**Stale-cache 500s:** `npm run build` rewrites `.next` while `next dev`
is running and corrupts the dev runtime (`Cannot find module './1682.js'`
→ every page 500 except `/`). Fix: stop dev, `Remove-Item -Recurse
-Force .next`, start dev again. Never build while dev is running.

## 3. Verification (run before every handoff)

```bash
npm run typecheck     # tsc --noEmit, must be clean
npm run lint          # next lint, zero warnings
npm run test:security # 48/48 PASS (pure-function regression suite)
npm run test:smoke    # 26/26 PASS against running dev (APP_URL override supported)
npm run build         # production compile; dev must be STOPPED first (see §2)
```

## 4. Performance baseline (K-09, measured 2026-09-26)

Production bundle (`npm run build`): First Load JS shared **87.3 kB**;
heaviest routes `/dashboard` 11.3 kB, `/provider/[slug]` 4.13 kB,
`/request-service` 3.48 kB; middleware 86.6 kB. Budgets: shared < 100 kB,
any route < 15 kB — investigate if exceeded.

Dev-mode response times (fresh `next dev`, first hit compiles; prod will
be faster at the edge):

| Route | Status | Time | Bytes |
| --- | --- | --- | --- |
| `/` | 200 | 1.27 s (compile) | 67,762 |
| `/search` | 200 | 0.22 s | 37,462 |
| `/services` | 200 | 0.11 s | 67,390 |
| `/login` | 200 | 0.08 s | 22,765 |
| `/api/health` | 200 | 0.01 s | 93 |
| `/sitemap.xml` | 200 | 0.05 s | 4,333 |
| `/robots.txt` | 200 | 0.04 s | 239 |

Why it stays fast: no `next/image` optimizer (plain `<img loading="lazy">`
with Supabase `?width=&quality=75` variants), zero webfont downloads
(system stack), zero eager third-party scripts (Google OAuth is
redirect-based via `signInWithOAuth`; one tiny inline theme script only),
DB search via `search_vector` (migration 0012), rate-limit hot path indexed
by `(key, hit_at)` (migration 0017).

## 5. Supabase migrations (`supabase/migrations/0001–0017`)

Apply with `supabase db push` (owner only, never from this agent).
`0017_rate_limits.sql` is pending application: until pushed, rate limiting
runs on the in-memory fallback (correct but per-instance). All migrations
are non-destructive (new tables/indexes/policies only).

## 6. Deploy (owner only — agent must NOT deploy)

1. `npm run typecheck && npm run lint && npm run test:security`
2. `npm run build` locally (dev stopped) as a dry run
3. Push to `main`; Vercel auto-deploys. Verify `/api/health`, homepage,
   `/sitemap.xml`, `/robots.txt`, and security headers on the deployment URL.
4. Rollback: Vercel dashboard → Deployments → Promote previous production
   deployment. No DB rollback needed (migrations are additive).

## 7. Incident playbooks

- **Many pages 500, `/api/health` ok:** stale `.next` on the host — redeploy
  (fresh build), see §2 for local equivalent.
- **429 spike on forms:** check `rate_limit_hits` growth; prune rows older
  than 1h; raise limits in the route if legitimate traffic.
- **Storage abuse:** uploads require approved listings + 2 MB + magic-byte
  checks; revoke via Storage dashboard and rotate keys if exfiltrated.
- **Suspected admin compromise:** remove email from `ADMIN_EMAILS`,
  redeploy, rotate `SUPABASE_SERVICE_ROLE_KEY`, review `admin_audit_log`.

## 8. Owner security checklist (blocked on owner, not code)

- [ ] Supabase → Auth → enable **leaked-password protection** (K-02)
- [ ] Supabase → Auth → enable **MFA/TOTP**; enroll authenticator on each
      admin account; set `ADMIN_REQUIRE_MFA=true`; restart (K-03)
- [ ] `supabase db push` to apply `0017_rate_limits.sql` (K-01)
- [ ] Real-device check below 400 px width (K-08); authenticated
      customer/provider/admin walkthrough with disposable accounts (K-07)

## 9. Agent constraints (standing)

No deploys, no production Supabase/Vercel setting changes, no production
data edits, no secrets in chat/files, no destructive tests. Preserve
user-facing features, auth/RLS, and working routes. Verify every code
change with §3.
