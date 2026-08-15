# Vantage Documentation

## Index

| Doc | Contents |
|-----|----------|
| [DEPLOY.md](DEPLOY.md) | Production runbook: Vercel + Fly + Neon + Upstash, smoke tests |
| [api.md](api.md) | REST reference: endpoints, auth, response shapes, caching, errors |
| [risk-assessment.md](risk-assessment.md) | Threat model v2: families, weights, soft cap, ban floor |
| [examples-sdks.md](examples-sdks.md) | curl, Node, Python clients for the API |
| [SECURITY.md](SECURITY.md) | Key proxy architecture and production hardening |
| [../QUICKSTART.md](../QUICKSTART.md) | Setup, commands, troubleshooting |
| [../README.md](../README.md) | Product overview and screenshots |

## The API in 60 seconds

```bash
# health
curl http://localhost:3001/health

# profile by any ID format (vanity, URL, SteamID64, SteamID32)
curl "http://localhost:3001/api/profile/aebu"

# full 10-player scoreboard (source aliases accepted)
curl "http://localhost:3001/api/matches/matchmaking/CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
```

Every response is wrapped:

```json
{ "success": true, "data": { }, "timestamp": "ISO-8601" }
```

The browser app never calls external providers directly. Requests flow
through the Next.js proxy (`/api/*`), which injects server-side keys; the
Fastify backend also falls back to `process.env` keys when run standalone.
Details in [SECURITY.md](SECURITY.md).

## Data sources

| Source | Used for |
|--------|----------|
| Steam Web API | identity, bans, level, CS2 lifetime stats, owned games, friends |
| Steam community (public) | profile wallpaper, avatar frame, favorite badge, level class |
| FACEIT Data API v4 | elo/level, lifetime stats, 40-match history, per-match stats, bans |
| Leetify API | 50-match history, aim/utility ratings, Premier CS Rating, teammates |

Upstream terms apply to operators; see the [LICENSE](../LICENSE) notices.
