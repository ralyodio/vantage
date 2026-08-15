# Client Examples

All examples hit the Fastify backend directly with per-request keys. From
the browser app, use the same paths without keys on the Next.js origin
(`/api/...` proxy).

## curl

```bash
# profile by vanity
curl -H "X-Steam-Api-Key: $STEAM_KEY" \
     -H "X-Faceit-Api-Key: $FACEIT_KEY" \
     -H "X-Leetify-Api-Key: $LEETIFY_KEY" \
     http://localhost:3001/api/profile/aebu

# full scoreboard (aliases accepted: matchmaking_wingman etc.)
curl -H "X-Steam-Api-Key: $STEAM_KEY" \
     -H "X-Leetify-Api-Key: $LEETIFY_KEY" \
     "http://localhost:3001/api/matches/matchmaking/CSGO-XXXX-XXXX-XXXX-XXXX-XXXXX"

# force refresh (empty JSON body, 10 min cooldown)
curl -X POST -H "Content-Type: application/json" \
     -H "X-Steam-Api-Key: $STEAM_KEY" \
     http://localhost:3001/api/profile/aebu/refresh
```

## Node 18+ (built-in fetch)

```javascript
const BASE = 'http://localhost:3001';
const headers = {
  'X-Steam-Api-Key': process.env.STEAM_API_KEY,
  'X-Faceit-Api-Key': process.env.FACEIT_API_KEY,
  'X-Leetify-Api-Key': process.env.LEETIFY_API_KEY,
};

async function getProfile(id) {
  const res = await fetch(`${BASE}/api/profile/${encodeURIComponent(id)}`, { headers });
  const body = await res.json();
  if (!body.success) throw new Error(body.error);
  return body.data;
}

const profile = await getProfile('aebu');
console.log(profile.steam.username, 'threat:', profile.risk.totalScore);

const wingman = await getProfile('76561198192472755');
const last = wingman.faceit?.matchHistory?.[0];
console.log(last.map, last.result, last.score);   // e.g. de_inferno loss 13-7
```

## React (TanStack Query)

```tsx
function useProfile(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${encodeURIComponent(id)}`);
      const body = await res.json();
      if (body.requiresCaptcha) throw new Error('captcha-required');
      if (!body.success) throw new Error(body.error);
      return body.data;
    },
    retry: false,
    staleTime: 60_000,
  });
}

// usage
const { data, isLoading } = useProfile(router.query.id as string);
```

## Python

```python
import os, requests

BASE = "http://localhost:3001"
HEADERS = {
    "X-Steam-Api-Key": os.environ["STEAM_API_KEY"],
    "X-Faceit-Api-Key": os.environ.get("FACEIT_API_KEY", ""),
    "X-Leetify-Api-Key": os.environ.get("LEETIFY_API_KEY", ""),
}

def get_profile(player_id: str) -> dict:
    r = requests.get(f"{BASE}/api/profile/{player_id}", headers=HEADERS)
    r.raise_for_status()
    body = r.json()
    if not body["success"]:
        raise RuntimeError(body["error"])
    return body["data"]

profile = get_profile("aebu")
print(profile["steam"]["username"], "threat:", profile["risk"]["totalScore"])
premier = profile["leetify"]["ranks"]["premier"]
print("Premier CS Rating:", premier)
```

## Retry with backoff

```javascript
async function getWithRetry(url, init, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, init);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 2 ** i * 1000));
      continue;
    }
    return res;
  }
  throw new Error(`gave up after ${tries} tries`);
}
```

## Gotchas

- **Refresh is POST with a JSON body** (`{}`); form-urlencoded gets a 415.
- **`data_source` aliases**: Leetify v3 reports `matchmaking_wingman` /
  `matchmaking_competitive`, but the v2 match endpoint serves all Valve
  queues as `matchmaking`. The API normalizes this for you.
- **FACEIT `matchHistory[].eloChange`** exists only when consecutive
  history items carry elo; the history endpoint often omits it, so treat
  it as optional.
- Profile responses can be **partially populated** when optional keys are
  absent: `faceit: null` means "checked, none found".
