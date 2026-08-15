# Vantage REST API

Base URL (dev): `http://localhost:3001`

All responses share one envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requiresCaptcha?: boolean;   // 429 path only
  timestamp: string;           // ISO-8601
}
```

## Authentication

The backend accepts per-request keys via headers (how the Next.js proxy
calls it):

```http
X-Steam-Api-Key: <key>      # required
X-Faceit-Api-Key: <key>      # optional, unlocks FACEIT data
X-Leetify-Api-Key: <key>     # optional, unlocks Leetify data
```

Missing optional keys yield partial profiles instead of errors. Standalone,
the backend falls back to `STEAM_API_KEY` / `FACEIT_API_KEY` /
`LEETIFY_API_KEY` from the environment.

---

## Endpoints

### GET /health

No auth. `{ success, status, timestamp, version }`.

### GET /api/stats

No auth. Search counter + server info.

### GET /api/profile/:id

Resolves `id` in any of these formats, then returns the full profile:

- `https://steamcommunity.com/id/<vanity>` or `/profiles/<steam64>`
- SteamID64, e.g. `76561199548276875`
- SteamID32, e.g. `STEAM_0:1:79400573`
- bare vanity, e.g. `aebu`

Query: `recaptcha_token` (optional, unlocks rate-limited requests).

**Response `data` (UserProfile):**

```typescript
{
  steam: SteamProfile;
  faceit?: FaceitStats | null;    // null = checked, none found
  leetify?: LeetifyStats | null;  // null = private or absent
  premier?: PremierStats | null;
  competitive?: CompetitiveStats | null;
  wingman?: WingmanStats | null;
  risk: RiskAssessment;
}
```

`SteamProfile` highlights (full shape in `packages/shared/src/types.ts`):

```typescript
{
  steamId64, username, realName?, avatar?, profileUrl,
  accountCreated?, level?, levelClass?,      // e.g. "friendPlayerLevel lvl_50"
  yearsOfService?, vacBanned, gameBanned, communityBanned?,
  daysSinceLastBan?, friendCount?, gameCount?, country?, state?,
  avatarFrame?: string,                      // equipped frame PNG
  profileBackground?: {                      // equipped wallpaper
    image?, videoMp4?, videoWebm?
  },
  favoriteBadge?: { name, level?, description?, icon? },
  cs2Stats?: {
    hoursPlayed?, hoursLast2Weeks?, kdRatio?, headshotPercentage?,
    totalKills?, totalDeaths?, totalMVPs?, totalRoundsPlayed?,
    achievementPercentage?, ...
  }
}
```

`FaceitStats` highlights: `elo`, `level`, `matches`, `winRate`, `avgKD`,
`avgKills`, `avgHeadshotPercent`, recent form, `activeBans`, plus
`matchHistory[]` (40 matches) with real map names, correct win/loss
(determined by faction roster scan, since the history endpoint omits
`playing_faction`), per-match K/D/A, MVPs, multi-kills, both team rosters
with avatars and SteamID64s (`steam64`), and `eloChange` derived from
match-to-match elo deltas when available.

`LeetifyStats` highlights: `ranks.leetify` (percentile, not a score),
`ranks.premier` (raw CS Rating used for the tier badge), `rating`
(aim/positioning/utility/clutch/opening plus CT/T relative),
`stats` (mechanics), `recent_teammates`, and `match_history[]` (50 matches).

`RiskAssessment`: see [risk-assessment.md](risk-assessment.md).

**Caching:** Redis, 7-day TTL with partial updates; a cached copy returns
instantly and refresh endpoints replenish it.

### POST /api/profile/:id/refresh

Invalidates cache and refetches. **10-minute cooldown per profile**; the
error includes the remaining wait. Send an empty JSON body
(`Content-Type: application/json`), not form-urlencoded.

### POST /api/profile/:id/refresh-matches

Refreshes only FACEIT + Leetify match history. No cooldown.

### GET /api/matches/:dataSource/:dataSourceId

Full scoreboard for one match.

- `dataSourceId` is the upstream share code (Valve) or provider match id.
- `dataSource` accepts Leetify v3 names **and** aliases; every
  `matchmaking*` variant (`matchmaking_wingman`, `matchmaking_competitive`,
  plain `matchmaking`) resolves to `matchmaking`, because Leetify's v2
  endpoint serves all Valve queues under that name. `premier`, `faceit`,
  `esea` pass through.

**Response `data` (MatchDetails):** `map_name`, `finished_at`,
`data_source`, `team_scores`, `duration_seconds`, optional
`demo_url` / `replay_url` / `has_banned_player`, and `stats[]` for all
players enriched with `avatar` and `steam_username`.

**Caching:** 5-minute TTL.

---

## Rate limiting

Per-IP + user-agent limits backed by Redis; excessive requests get `429`
with `requiresCaptcha: true` and can be unlocked by retrying with
`?recaptcha_token=` (Google reCAPTCHA, optional to configure).

## Error codes

| Code | Meaning |
|------|---------|
| 400 | Invalid Steam ID format |
| 404 | Profile or match not found |
| 429 | Rate limited (captcha may unlock) |
| 500 | Upstream or internal failure |
| 503 | Redis unavailable |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `STEAM_API_KEY` | required upstream key |
| `FACEIT_API_KEY`, `LEETIFY_API_KEY` | optional upstream keys |
| `DATABASE_URL` | PostgreSQL (Prisma) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | cache + rate limits |
| `API_PORT` (3001), `API_HOST` | backend bind |
| `BACKEND_API_URL` | Next.js proxy target |
| `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | anti-spam |
| `INTERNAL_API_KEY` | optional shared secret on the stats proxy |

Client examples: [examples-sdks.md](examples-sdks.md).
