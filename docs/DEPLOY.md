# Optional: Hosted Deployment

Vantage is a self-hosted project — clone it, add keys, `npm run dev` (see
[QUICKSTART](../QUICKSTART.md)). This runbook is **only** for anyone who
wants to run it as a public instance. Four managed services, all with
free tiers: **Vercel** (web), **Fly.io** (API), **Neon** (PostgreSQL),
**Upstash** (Redis). Total cost at small scale: **$0–5/month**. End state:

```
Browser ─▶ Vercel (Next.js, /api proxy injects keys)
              │  server-to-server (no CORS needed)
              ▼
           Fly.io (Fastify API + threat engine)
              ├─▶ Neon       (Prisma, profile upserts)
              ├─▶ Upstash    (cache, rate limits — REDIS_URL, TLS)
              └─▶ Steam / FACEIT / Leetify
```

> If you do open an instance to the public, pass the smoke tests at the
> end first. The stack is rate-limit-first; verify it holds before traffic.

---

## 0. Prerequisites

- Accounts: [github.com](https://github.com) (push access), [vercel.com](https://vercel.com),
  [fly.io](https://fly.io), [neon.tech](https://neon.tech), [upstash.com](https://upstash.com)
- CLI tools: `npm i -g vercel`, and `fly` ([install](https://fly.io/docs/flyctl/install/))
- API keys: Steam (required), FACEIT + Leetify (recommended)
- reCAPTCHA v2 site/secret pair ([admin console](https://www.google.com/recaptcha/admin))
  - required for production; the anti-spam service warns and disables otherwise

---

## 1. Neon — PostgreSQL

1. Create project → copy the **pooled** connection string
   (`...-pooler...neon.tech/...?sslmode=require`).
2. Push the schema once from your machine:

```bash
DATABASE_URL="<neon-pooled-url>" npm run db:generate
DATABASE_URL="<neon-pooled-url>" npm run db:push
```

Save the URL as `DATABASE_URL` for later steps.

## 2. Upstash — Redis

1. Create a **Global** database → copy the `rediss://` URL.
2. That's it. It becomes `REDIS_URL` (the API prefers it over
   `REDIS_HOST`/`REDIS_PORT` and enables TLS from the scheme).

## 3. Fly.io — API

The repo ships `Dockerfile` + `fly.toml` (root context, Debian slim on
Node 22; the build compiles the API **and** the shared workspace package,
relinking `@vantage/shared` to compiled CJS — no TypeScript runs in
production).

```bash
fly auth login

# rename `app = "vantage-api"` in fly.toml first if taken
fly launch --no-deploy          # accept the detected Dockerfile

fly secrets set \
  STEAM_API_KEY="..." \
  FACEIT_API_KEY="..." \
  LEETIFY_API_KEY="..." \
  DATABASE_URL="<neon-pooled-url>" \
  REDIS_URL="rediss://default:...@...:6379" \
  CORS_ORIGIN="https://<your-web>.vercel.app" \
  RECAPTCHA_SECRET_KEY="..."

fly deploy
```

Verify:

```bash
curl https://vantage-api.fly.dev/health
curl "https://vantage-api.fly.dev/api/profile/aebu" \
  -H "X-Steam-Api-Key: $STEAM_KEY"      # full profile, 200
```

Note the URL — e.g. `https://vantage-api.fly.dev`.

## 4. Vercel — web

1. Push the repo to GitHub (or use your existing remote).
2. Vercel → **Add New Project** → import the repo.
3. **Root Directory: `apps/web`** (critical — everything else stays default;
   Vercel resolves the workspace + `transpilePackages` automatically).
4. Environment variables:

| Variable | Value |
|----------|-------|
| `BACKEND_API_URL` | `https://vantage-api.fly.dev` |
| `STEAM_API_KEY` | your key (server-side proxy) |
| `FACEIT_API_KEY` | your key |
| `LEETIFY_API_KEY` | your key |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | public site key |
| `RECAPTCHA_SECRET_KEY` | secret (unused by web, keeps envs symmetric) |

5. Deploy. Then lock API CORS: update the Fly secret
   `CORS_ORIGIN` to your final web origin(s) (custom domain included) and
   `fly deploy` is not needed — secrets apply on next release; restart with
   `fly apps restart vantage-api`.

### Environment matrix (where each var lives)

| Variable | Vercel | Fly |
|----------|:------:|:---:|
| `STEAM_API_KEY` / `FACEIT_API_KEY` / `LEETIFY_API_KEY` | ✓ (proxy) | ✓ (fallback + direct callers) |
| `BACKEND_API_URL` | ✓ | |
| `DATABASE_URL` | | ✓ |
| `REDIS_URL` | | ✓ |
| `CORS_ORIGIN` | | ✓ |
| `RECAPTCHA_SECRET_KEY` | ✓ | ✓ |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | ✓ (public by design) | |

---

## 5. Custom domain (optional)

- **Web**: Vercel → Settings → Domains → add `vantage.example.com`.
- **API**: `fly certs add api.example.com` + the DNS records Fly prints.
- Update `CORS_ORIGIN` with the final web origin.

---

## 6. Smoke tests (pre-launch gate)

```bash
WEB="https://<your-web>.vercel.app"
API="https://vantage-api.fly.dev"

# health + stats
curl -fsS "$API/health" | grep '"ok"'
curl -fsS "$API/api/stats" | grep success

# profile through the proxy (no keys in browser)
curl -fsS "$WEB/api/profile/aebu" | grep -o '"username":"[^"]*"'

# full scoreboard via alias (wingman/competitive resolve)
curl -fsS "$WEB/api/matches/matchmaking_wingman/CSGO-YEFCz-dMGNV-t3xf6-pw9pk-mtLMB" \
  | grep -c steam_username     # expect 4

# rate limit fires and captcha flag comes back
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code} " "$WEB/api/profile/aebu"; done
# expect 200s then 429(s)

# OG card renders on the home URL
curl -s "$WEB" | grep 'og:image'
```

Then open the web app in a browser: search a known profile, expand a
match, open a scoreboard, force one 429 to see the captcha modal.

---

## 7. Traffic hardening (Reddit day)

| Control | Where | Setting |
|---------|-------|---------|
| IP rate limit | API (Redis) | already enforced per-IP+UA, 10 profile/min |
| reCAPTCHA unlock | Web + API | verify in smoke test above |
| Profile refresh cooldown | API | 10 min, already enforced |
| Cache hit rate | Upstash console | watch `profile:*` keys climb |
| Upstash alert | Upstash | alert at 80% of free quota |
| Neon autosuspend | Neon console | fine (scale-to-zero OK) |
| Fly machines | fly.toml | `min_machines_running = 1` (no cold start) |
| Steam quota | Steam key page | 100k/day — cache absorbs most reads |

Optional burst lever: scale API with
`fly scale count 2 --region fra` (Redis-backed rate limits stay
consistent across machines).

## 8. Optional: background worker

The BullMQ worker (`npm run worker`) is not deployed by default — the API
path is fully synchronous through cache. If you enable background refresh
later, deploy it as a second Fly app from the same image:

```toml
# worker fly.toml: same build, CMD ["node", "apps/api/dist/worker.js"]
```

## 9. Rollback

- **API**: `fly releases` → `fly rollback <release-id>` (image-level, instant).
- **Web**: Vercel dashboard → Deployments → **Promote to Production** on any
  previous build.
- **Bad data/cache only**: flush a profile
  `fly ssh console -a vantage-api` → inside: `redis-cli -u "$REDIS_URL" del "profile:<steam64>"`
  or via Upstash console.
- **Schema**: Neon branching (create branch → test migration → promote).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Fly deploy fails at `prisma generate` | ensure `prisma/` dir copied (it is); run `fly logs` for the true error |
| API up but 503s | `fly logs` → look for `Redis connection failed` — check `REDIS_URL` scheme is `rediss://` |
| Web 502 to API | `BACKEND_API_URL` missing a scheme/host on Vercel |
| Prisma `P1001` | `DATABASE_URL` uses the pooled URL with `?sslmode=require` |
| Steam 403 from Fly | key tied to a domain in Steam console — register your API domain there |
| Scoreboards show one player | stale cache from before the alias fix — flush the profile or Refresh |
