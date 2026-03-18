const MAP_ALIASES: Record<string, string> = {
  mirage: 'de_mirage',
  inferno: 'de_inferno',
  dust2: 'de_dust2',
  dust_2: 'de_dust2',
  'dust ii': 'de_dust2',
  nuke: 'de_nuke',
  overpass: 'de_overpass',
  ancient: 'de_ancient',
  anubis: 'de_anubis',
  vertigo: 'de_vertigo',
  train: 'de_train',
  office: 'cs_office',
  italy: 'cs_italy',
  cache: 'de_cache',
  cobblestone: 'de_cbble',
  cbble: 'de_cbble',
  cobble: 'de_cbble',
};

const KNOWN_MAPS = new Set([
  'de_mirage',
  'de_inferno',
  'de_dust2',
  'de_nuke',
  'de_overpass',
  'de_ancient',
  'de_anubis',
  'de_vertigo',
  'de_train',
  'cs_office',
  'cs_italy',
  'de_cache',
  'de_cbble',
]);

const DISPLAY_NAMES: Record<string, string> = {
  de_mirage: 'Mirage',
  de_inferno: 'Inferno',
  de_dust2: 'Dust II',
  de_nuke: 'Nuke',
  de_overpass: 'Overpass',
  de_ancient: 'Ancient',
  de_anubis: 'Anubis',
  de_vertigo: 'Vertigo',
  de_train: 'Train',
  cs_office: 'Office',
  cs_italy: 'Italy',
  de_cache: 'Cache',
  de_cbble: 'Cobblestone',
};

export function normalizeMapKey(raw?: string | null): string {
  if (!raw) return 'unknown';
  let s = String(raw).trim().toLowerCase();
  if (!s) return 'unknown';
  if (/^\d+v\d+$/i.test(s) || s === 'wingman') return 'unknown';

  s = s.replace(/^\/+|\/+$/g, '');
  s = s.replace(/\.bsp$/i, '');
  const parts = s.split(/[\\/]/);
  s = parts[parts.length - 1] || s;
  s = s.replace(/\s+/g, '_');

  if (MAP_ALIASES[s]) return MAP_ALIASES[s];
  if (KNOWN_MAPS.has(s)) return s;

  const bare = s.replace(/^(de_|cs_)/, '');
  if (MAP_ALIASES[bare]) return MAP_ALIASES[bare];
  if (KNOWN_MAPS.has(`de_${bare}`)) return `de_${bare}`;
  if (KNOWN_MAPS.has(`cs_${bare}`)) return `cs_${bare}`;

  return 'unknown';
}

export function getMapDisplayName(raw?: string | null): string {
  if (!raw) return 'Unknown';
  const key = normalizeMapKey(raw);
  if (key !== 'unknown' && DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
  const t = String(raw).trim();
  if (/^\d+v\d+$/i.test(t)) return 'Unknown';
  return t
    .replace(/^(de_|cs_)/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getMapIcon(raw?: string | null): string {
  const key = normalizeMapKey(raw);
  if (key === 'unknown') return '/maps/icons/unknown.svg';
  return `/maps/icons/${key}.png`;
}

export function getMapBanner(raw?: string | null): string {
  const key = normalizeMapKey(raw);
  if (key === 'unknown') return '/maps/thumbs/unknown.svg';
  return `/maps/thumbs/${key}.png`;
}

export function getSourceLogo(source?: string | null): string {
  const s = (source || '').toLowerCase();
  if (s.includes('faceit')) return LOGOS.faceit;
  if (s.includes('leetify')) return LOGOS.leetifyMark;
  if (s.includes('steam')) return LOGOS.steam;
  return LOGOS.cs2;
}

export function getFaceitLevelIcon(level?: number | null): string | null {
  if (!level || level < 1 || level > 10) return null;
  return `/logos/faceit-levels/${level}.svg`;
}

export const LOGOS = {
  steam: '/logos/steam.svg',
  faceit: '/logos/faceit.svg',
  leetify: '/logos/leetify.svg',
  leetifyMark: '/logos/leetify-mark.svg',
  cs2: '/logos/cs2.svg',
  t: '/logos/t.svg',
  ct: '/logos/ct.svg',
} as const;

export function formatPct(val?: number | null, digits = 0): string {
  if (val == null || Number.isNaN(val)) return '—';
  let n = val;
  if (n > 1 && n <= 100) return `${n.toFixed(digits)}%`;
  if (n <= 1) return `${(n * 100).toFixed(digits)}%`;
  return `${n.toFixed(digits)}%`;
}

export function formatNum(val?: number | null, digits = 2): string {
  if (val == null || Number.isNaN(val)) return '—';
  return val.toFixed(digits);
}
