# Security Architecture

## Threat model for keys

Three upstream providers, three secrets that must never reach the browser.
Vantage solves this with a server-side proxy: keys exist only in the
deployment's environment.

```
Browser (no keys, ever)
   │
   ▼
Next.js pages            /api/profile/*, /api/matches/*, /api/stats
   │  injects X-Steam/Faceit/Leetify-Api-Key from server env
   ▼
Fastify backend          rate limit (Redis) → cache → upstream calls
   │
   ▼
Steam / FACEIT / Leetify
```

## Rules

1. **Keys live in `.env` or platform secrets.** Both the Next.js server
   and Fastify read the same variables (`STEAM_API_KEY`, `FACEIT_API_KEY`,
   `LEETIFY_API_KEY`).
2. **Never use the `NEXT_PUBLIC_` prefix** on a key. That prefix compiles
   the value into client JavaScript. The only intentionally public vars
   are `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (a site key is designed to be
   public).
3. **Backend also accepts per-request keys** via the `X-*-Api-Key`
   headers. The proxy uses this path; standalone API consumers can too.
   When headers are absent, Fastify falls back to its own environment.
4. `.env` is git-ignored. `.env.example` ships placeholders only.

## Rate limiting and abuse controls

- Redis-backed counters keyed on IP + user-agent + forwarded headers,
  applied before any upstream call.
- Clients exceeding limits receive `429` with `requiresCaptcha: true`;
  a valid Google reCAPTCHA token (`?recaptcha_token=`) unlocks the
  request without resetting the counter.
- Redis connection loss fails closed for limiting (503) rather than
  silently allowing load upstream.
- Profile refreshes are additionally throttled per-profile (10-minute
  cooldown) to protect upstream quotas.

## Verify your deployment

```bash
# 1. Backend direct, per-request keys
curl -H "X-Steam-Api-Key: $STEAM_KEY" \
     http://localhost:3001/api/profile/aebu

# 2. Browser-facing proxy works without keys
curl http://localhost:3000/api/profile/aebu

# 3. Keys absent from client bundle
#    DevTools → Network → any /api/* request: no X-*-Api-Key headers,
#    and grep the built JS for the key value (should find nothing).
```

## Production checklist

- [ ] All secrets set in the platform (never committed), no `NEXT_PUBLIC_` on keys
- [ ] `BACKEND_API_URL` points at the deployed Fastify origin
- [ ] Redis and PostgreSQL not exposed publicly; `REDIS_PASSWORD` set if networked
- [ ] reCAPTCHA pair configured (`RECAPTCHA_SECRET_KEY` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`)
- [ ] TLS in front of both apps; trust only your own proxy's `X-Forwarded-For`
- [ ] `INTERNAL_API_KEY` set if exposing `/api/stats` beyond localhost
- [ ] Upstream terms respected: Steam, FACEIT, and Leetify usage policies;
      Leetify attribution ("Data Provided by Leetify") displayed in the UI

## Attribution and trademark notes

This project bundles third-party artwork (Valve map art and Premier
banners, FACEIT level badges, Leetify marks, flagcdn flags) for
identification only and claims no affiliation. Removal on request; see
[LICENSE](../LICENSE) for the full notice.
