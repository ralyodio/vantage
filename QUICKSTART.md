# Quickstart

## 1. Requirements

- Node.js 18+
- Docker (PostgreSQL 16 + Redis 7 run in compose)
- A Steam Web API key (FACEIT and Leetify optional but recommended)

## 2. Setup

```bash
./setup.sh
```

Manual equivalent:

```bash
cp .env.example .env
npm install
npm run docker:up     # PostgreSQL + Redis
npm run db:generate   # Prisma client
npm run db:push       # schema
```

## 3. Keys

Add to `.env`:

```env
STEAM_API_KEY="..."     # https://steamcommunity.com/dev/apikey
FACEIT_API_KEY="..."    # https://developers.faceit.com/   (optional)
LEETIFY_API_KEY="..."   # contact Leetify                  (optional)
```

Keys are read server-side only; the Next.js proxy injects them when calling
the backend. Never prefix them with `NEXT_PUBLIC_`.

## 4. Run

```bash
npm run dev            # API + web together
npm run dev:api        # backend only, http://localhost:3001
npm run dev:web        # frontend only, http://localhost:3000
npm run worker         # optional BullMQ background worker
```

## 5. Try it

Open http://localhost:3000 and search any of:

- `aebu` (vanity)
- `https://steamcommunity.com/id/aebu` (profile URL)
- `76561199548276875` (SteamID64)
- `STEAM_0:1:79400573` (SteamID32)

Then open any match in the history for the full scoreboard.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run API + web with hot reload |
| `npm run build` / `build:web` / `build:api` | Production builds |
| `npm run worker` | BullMQ background jobs |
| `npm run db:studio` | Prisma Studio database UI |
| `npm run docker:up` / `docker:down` | Start/stop PostgreSQL + Redis |
| `node scripts/fetch-map-assets.mjs` | Refresh local map artwork |
| `node scripts/take-screenshots.cjs` | Regenerate the README gallery |

## Stopping everything

`Ctrl+C` kills the dev servers (or `pkill -f vantage/node_modules/.bin/concurrently`
if detached), then `npm run docker:down`.

## Troubleshooting

**Port in use**

```bash
lsof -ti:3000 | xargs kill -9    # or 3001
```

**Database / Redis errors**

```bash
docker-compose ps              # both healthy?
docker-compose restart postgres redis
npm run db:push
```

**"STEAM_API_KEY required"** - key missing in `.env`, or restart `dev:api`
after editing it.

**Profile looks stale** - hit Refresh (10 min cooldown) or flush the cache:
`docker exec vantage-redis redis-cli del "profile:<steam64>"`.

**FACEIT scoreboards show one player** - stale cache from before the source
alias fix; flush as above or Refresh All.

## Where things live

| Path | Contents |
|------|----------|
| `apps/web/src/pages` | Home, profile, 404, API proxies |
| `apps/web/src/components` | UI (profile card, match cards, scoreboard modal, risk meter...) |
| `apps/web/src/lib/map-assets.ts` | Map/flag/logo/premier helpers |
| `apps/web/public` | Maps, logos, premier banners, country flags |
| `apps/api/src/routes` | Profile + matches endpoints |
| `apps/api/src/services` | Steam (cosmetics incl.), FACEIT, Leetify, cache |
| `packages/shared/src` | Types, Steam resolver, threat calculator |
| `prisma/schema.prisma` | Database schema |

Next: [README](README.md) · [API docs](docs/api.md) · [Deploy to production](docs/DEPLOY.md)
