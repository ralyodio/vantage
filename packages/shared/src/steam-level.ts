/**
 * Official Steam friendPlayerLevel border colors
 * (from community CSS .friendPlayerLevel.lvl_*)
 */
const LEVEL_BORDER: Record<number, string> = {
  0: '#9b9b9b',
  10: '#c02942',
  20: '#d95b43',
  30: '#fecc23',
  40: '#467a3c',
  50: '#4e8ddb',
  60: '#7652c9',
  70: '#c252c9',
  80: '#542437',
  90: '#997c52',
};

/** Soft glow for UI accents around the badge */
const LEVEL_GLOW: Record<number, string> = {
  0: 'rgba(155,155,155,0.4)',
  10: 'rgba(192,41,66,0.45)',
  20: 'rgba(217,91,67,0.45)',
  30: 'rgba(254,204,35,0.45)',
  40: 'rgba(70,122,60,0.45)',
  50: 'rgba(78,141,219,0.5)',
  60: 'rgba(118,82,201,0.5)',
  70: 'rgba(194,82,201,0.5)',
  80: 'rgba(84,36,55,0.5)',
  90: 'rgba(153,124,82,0.5)',
};

/** Sprite sheets for level ≥ 100 (community CDN) */
const LEVEL_SPRITES: Record<number, string> = {
  100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_hexagons.png',
  200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shields.png',
  300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_books.png',
  400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_chevrons.png',
  500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_circle2.png',
  600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_angle.png',
  700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_flag.png',
  800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_wings.png',
  900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_arrows.png',
  1000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_crystals.png',
  1100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_space.png',
  1200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_waterelement.png',
  1300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_fireelement.png',
  1400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_earthelement.png',
  1500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_airelement_1-2.png',
  1600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_airelement_3-4.png',
  1700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_airelement_5-6.png',
  1800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_airelement_7-8.png',
  1900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_airelement_9-10.png',
  2000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_geo_1-2.png?v=2',
  2100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_geo_3-4.png?v=2',
  2200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_geo_5-6.png?v=2',
  2300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_geo_7-8.png?v=2',
  2400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_geo_9-10.png?v=2',
  2500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_mandala_1-2.png?v=2',
  2600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_mandala_3-4.png?v=2',
  2700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_mandala_5-6.png?v=2',
  2800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_mandala_7-8.png?v=2',
  2900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_mandala_9-10.png?v=2',
  3000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_spiro_1-2.png?v=2',
  3100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_spiro_3-4.png?v=2',
  3200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_spiro_5-6.png?v=2',
  3300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_spiro_7-8.png?v=2',
  3400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_spiro_9-10.png?v=2',
  3500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_patterns_1-2.png?v=2',
  3600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_patterns_3-4.png?v=2',
  3700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_patterns_5-6.png?v=2',
  3800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_patterns_7-8.png?v=2',
  3900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_patterns_9-10.png?v=2',
  4000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shapes_1.png?v=2',
  4100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shapes_2.png?v=2',
  4200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shapes_3.png?v=2',
  4300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shapes_4.png?v=2',
  4400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_shapes_5.png?v=2',
  4500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_grunge_1.png?v=2',
  4600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_grunge_2.png?v=2',
  4700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_grunge_3.png?v=2',
  4800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_grunge_4.png?v=2',
  4900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_grunge_5.png?v=2',
  5000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_halftone_1.png?v=2',
  5100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_halftone_2.png?v=2',
  5200: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_halftone_3.png?v=2',
  5300: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5300_dashes.png',
  5400: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5400_crosshatch.png',
  5500: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5500_spiral.png',
  5600: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5600_leaves.png',
  5700: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5700_mountain.png',
  5800: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5800_rain.png',
  5900: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_5900_tornado.png',
  6000: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_6000_snowflake.png',
  6100: 'https://community.akamai.steamstatic.com/public/shared/images/community/levels_6100_crown.png',
};

export type SteamLevelStyle = {
  /** 0, 10, … 90 for border colors; 100, 200, … for sprites */
  band: number;
  borderColor: string;
  glow: string;
  /** Sprite sheet for level ≥ 100 */
  backgroundImage?: string;
  /** Y offset into sprite (lvl_plus_N) */
  backgroundPositionY: number;
  /** Use special non-circle badge */
  isSpecial: boolean;
  className: string;
};

/**
 * Steam uses:
 * - lvl_0…lvl_90 for 0–99 (border color only)
 * - lvl_100, lvl_200… for shape sprite
 * - lvl_plus_0…lvl_plus_90 for which row in the sprite (tens within the hundred)
 */
export function getSteamLevelStyle(level?: number | null): SteamLevelStyle {
  const lvl = level == null || level < 0 ? 0 : Math.floor(level);

  if (lvl < 100) {
    const band = Math.floor(lvl / 10) * 10;
    return {
      band,
      borderColor: LEVEL_BORDER[band] ?? LEVEL_BORDER[0],
      glow: LEVEL_GLOW[band] ?? LEVEL_GLOW[0],
      backgroundPositionY: 0,
      isSpecial: false,
      className: `friendPlayerLevel lvl_${band}`,
    };
  }

  const hundred = Math.floor(lvl / 100) * 100;
  const tens = Math.floor((lvl % 100) / 10) * 10;
  // Find nearest defined sprite band ≤ hundred
  let spriteBand = hundred;
  while (spriteBand > 100 && !LEVEL_SPRITES[spriteBand]) {
    spriteBand -= 100;
  }
  if (!LEVEL_SPRITES[spriteBand]) spriteBand = 100;

  return {
    band: spriteBand,
    borderColor: '#e5e5e5',
    glow: 'rgba(229,229,229,0.35)',
    backgroundImage: LEVEL_SPRITES[spriteBand],
    backgroundPositionY: -(tens / 10) * 32, // lvl_plus_10 → -32px, etc.
    isSpecial: true,
    className: `friendPlayerLevel lvl_${spriteBand} lvl_plus_${tens}`,
  };
}

export function getSteamLevelBand(level?: number | null): number {
  return getSteamLevelStyle(level).band;
}

export function getSteamLevelColor(level?: number | null): string {
  return getSteamLevelStyle(level).borderColor;
}

export function getSteamLevelGlow(level?: number | null): string {
  return getSteamLevelStyle(level).glow;
}

/** Parse "friendPlayerLevel lvl_50 lvl_plus_0" → 50 (or 100+ band) */
export function parseSteamLevelClass(levelClass?: string | null): number | null {
  if (!levelClass) return null;
  const m = levelClass.match(/lvl_(\d+)/);
  if (!m) return null;
  return Number(m[1]);
}

export function steamId64ToAccountId(steamId64: string): number | null {
  try {
    const id = BigInt(steamId64);
    const base = BigInt('76561197960265728');
    const accountId = id - base;
    if (accountId <= BigInt(0) || accountId > BigInt('4294967295')) return null;
    return Number(accountId);
  } catch {
    return null;
  }
}
