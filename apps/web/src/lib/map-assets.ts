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

/** Official CS2 Premier rating tiers (k = floor(rating/5000), clamped to 6) */
export const PREMIER_TIER_COLORS = [
  '#9A9A9A', // 0–4,999     grey
  '#5E98D9', // 5,000–9,999 light blue
  '#4B69FF', // 10–14,999   blue
  '#8847FF', // 15–19,999   purple
  '#D32CE6', // 20–24,999   pink
  '#EB4B4B', // 25–29,999   red
  '#E4AE39', // 30,000+     gold
] as const;

/** Leetify-style cs-rating badge palette per tier (line / plate / text) */
export const PREMIER_TIER_STYLES: {
  line: string;
  plate: string;
  text: string;
}[] = [
  // tier 0 — Gray ~1,000–4,999 (neutral grey, matches banner accent)
  { line: '#9A9A9A', plate: '#2C2F37', text: '#C9CDD4' }, // tier 0
  { line: '#5e98d9', plate: '#061c36', text: '#8bc1ff' }, // tier 1
  { line: '#4c6aff', plate: '#060e37', text: '#8a9dfe' }, // tier 2
  { line: '#8847ff', plate: '#180638', text: '#b48bff' }, // tier 3
  { line: '#d32ce6', plate: '#320638', text: '#f177ff' }, // tier 4
  { line: '#eb4b4b', plate: '#380606', text: '#ff8686' }, // tier 5
  { line: '#ffd700', plate: '#383006', text: '#ffdf35' }, // tier 6
];

export function getPremierTier(rating?: number | null): number | null {
  if (rating == null || !Number.isFinite(Number(rating))) return null;
  const r = Number(rating);
  if (r <= 0) return null;
  return Math.min(Math.floor(r / 5000), 6);
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

/** ISO 3166-1 alpha-2 code → emoji flag (🇷🇴, 🇨🇦, …); null when not a valid code */
export function countryFlag(code?: string | null): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  const cc = code.toUpperCase();
  // regional indicator symbols
  const cp1 = 0x1f1e6 + cc.charCodeAt(0) - 65;
  const cp2 = 0x1f1e6 + cc.charCodeAt(1) - 65;
  return String.fromCodePoint(cp1, cp2);
}
