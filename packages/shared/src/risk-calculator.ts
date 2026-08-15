import type { RiskAssessment, RiskFlag, SteamProfile, FaceitStats, LeetifyStats } from './types';

export interface RiskCalculationInput {
  steam: SteamProfile;
  faceit?: FaceitStats | null;
  leetify?: LeetifyStats | null;
  premier?: { rating: number } | null;
}

/** Flag category used by the UI grouping */
export type RiskCategory =
  | 'ACCOUNT'
  | 'STATISTICS'
  | 'PERFORMANCE'
  | 'BEHAVIORAL';

export const RISK_FLAG_CATEGORIES: Record<string, RiskCategory> = {
  // Account
  VAC_BANNED: 'ACCOUNT',
  GAME_BANNED: 'ACCOUNT',
  COMMUNITY_BANNED: 'ACCOUNT',
  FACEIT_BANNED: 'ACCOUNT',
  NEW_ACCOUNT: 'ACCOUNT',
  YOUNG_ACCOUNT: 'ACCOUNT',
  HIDDEN_PROFILE: 'ACCOUNT',
  LOW_STEAM_LEVEL: 'ACCOUNT',
  SMURF_SIGNATURE: 'ACCOUNT',
  // Statistics
  EXTREME_HEADSHOT: 'STATISTICS',
  INHUMAN_REACTIONS: 'STATISTICS',
  PERFECT_SPRAY: 'STATISTICS',
  SKILL_IMBALANCE: 'STATISTICS',
  AIM_UTILITY_GAP: 'STATISTICS',
  HIGH_KD_LOW_MATCHES: 'STATISTICS',
  // Performance
  PERFECT_MOVEMENT: 'PERFORMANCE',
  DOMINANT_T_ENTRIES: 'PERFORMANCE',
  DOMINANT_CT_HOLDS: 'PERFORMANCE',
  PERFECT_CROSSHAIR: 'PERFORMANCE',
  NEW_ACCOUNT_DOMINATING: 'PERFORMANCE',
  RATING_SPIKE: 'PERFORMANCE',
  // Behavioral
  NEW_FACEIT_HIGH_LEVEL: 'BEHAVIORAL',
  INCONSISTENT_PERFORMANCE: 'BEHAVIORAL',
  LOW_HOURS_HIGH_SKILL: 'BEHAVIORAL',
  EXTREME_SIDE_BIAS: 'BEHAVIORAL',
  STACKED_RED_FLAGS: 'BEHAVIORAL',
};

// ─── helpers ───────────────────────────────────────────────────────────────

function toDate(v: Date | string | undefined | null): Date | null {
  if (!v) return null;
  const d = typeof v === 'string' ? new Date(v) : v;
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysSince(d: Date): number {
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}

/** Normalize values that may be 0–1 ratios or 0–100 percentages → 0–100 */
function asPercent(v: number | undefined | null): number | null {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n >= 0 && n <= 1) return n * 100;
  return n;
}

/** Normalize ratings that may be 0–1 or 0–100 → 0–100 */
function asScore100(v: number | undefined | null): number | null {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n >= 0 && n <= 1.5) return n * 100; // allow slight overshoot on 0–1 scales
  return n;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function push(
  flags: RiskFlag[],
  flag: string,
  weight: number,
  reason: string
) {
  const w = Math.round(weight);
  if (w <= 0) return;
  flags.push({ flag, weight: w, reason, detected: true });
}

/**
 * Soft-cap raw point sum into 0–100.
 * Avoids the old model where 3–4 medium flags instantly hit 100.
 * ~25 raw → ~22, ~45 → ~36, ~70 → ~50, ~100 → ~63, ~160 → ~80, ~250 → ~92
 */
function softCap(raw: number): number {
  if (raw <= 0) return 0;
  return Math.round(100 * (1 - Math.exp(-raw / 55)));
}

// ─── main ──────────────────────────────────────────────────────────────────

/**
 * Vantage Threat Score (0–100)
 *
 * Graduated multi-signal model:
 * - Account integrity (bans, age, privacy, smurf signature)
 * - Statistical outliers vs human/pro baselines
 * - Performance patterns (movement, openings, preaim)
 * - Behavioral progression (hours vs skill, faceit climb, variance)
 * - Interaction bonus when several independent red flags co-occur
 *
 * Values from Leetify are normalized for both 0–1 and 0–100 API shapes.
 */
export function calculateRiskScore(data: RiskCalculationInput): RiskAssessment {
  const flags: RiskFlag[] = [];
  let raw = 0;

  const steam = data.steam;
  const faceit = data.faceit ?? undefined;
  const leetify = data.leetify ?? undefined;
  const created = toDate(steam.accountCreated);
  const ageDays = created ? daysSince(created) : null;
  const ageYears = ageDays != null ? ageDays / 365 : null;
  const hours = steam.cs2Stats?.hoursPlayed ?? null;

  const aim = asScore100(leetify?.rating?.aim);
  const positioning = asScore100(leetify?.rating?.positioning);
  const utility = asScore100(leetify?.rating?.utility);
  const hs = asPercent(leetify?.stats?.accuracy_head);
  const spray = asPercent(leetify?.stats?.spray_accuracy);
  const cstrafe = asPercent(leetify?.stats?.counter_strafing_good_shots_ratio);
  const reaction = leetify?.stats?.reaction_time_ms ?? null;
  const preaim = leetify?.stats?.preaim; // degrees off — lower is better
  const tOpen = asPercent(leetify?.stats?.t_opening_duel_success_percentage);
  const ctOpen = asPercent(leetify?.stats?.ct_opening_duel_success_percentage);
  const ctRel = leetify?.rating?.ct_leetify;
  const tRel = leetify?.rating?.t_leetify;

  // Track independent “families” for interaction bonus
  let banSignal = false;
  let ageSignal = false;
  let aimbotishSignal = false;
  let progressionSignal = false;

  // ═════════════════════════════════════════════════════════════════════════
  // ACCOUNT
  // ═════════════════════════════════════════════════════════════════════════

  // VAC — still the strongest single signal for ban evasion / smurf after ban
  if (steam.vacBanned) {
    const days = steam.daysSinceLastBan ?? 0;
    // Recent bans slightly worse; old ban on active high-skill still serious
    let w = 48;
    if (days > 0 && days < 365) w = 55;
    else if (days > 365 * 3) w = 42;
    push(
      flags,
      'VAC_BANNED',
      w,
      days > 0
        ? `VAC ban on record (${days} days since last ban) — high ban-evasion risk if this is a fresh competitive identity`
        : 'VAC ban on record — high ban-evasion risk if this is a replacement account'
    );
    raw += w;
    banSignal = true;
  } else if (steam.gameBanned) {
    const days = steam.daysSinceLastBan ?? 0;
    const w = days > 0 && days < 180 ? 28 : 22;
    push(
      flags,
      'GAME_BANNED',
      w,
      days > 0
        ? `Game ban on record (${days} days ago)`
        : 'Game ban on record'
    );
    raw += w;
    banSignal = true;
  }

  if (steam.communityBanned) {
    const w = 8;
    push(flags, 'COMMUNITY_BANNED', w, 'Steam community ban active');
    raw += w;
  }

  if (faceit?.hasBan && faceit.activeBans && faceit.activeBans.length > 0) {
    const reasons = faceit.activeBans.map((b) => b.reason).filter(Boolean).join(', ');
    const w = 32;
    push(
      flags,
      'FACEIT_BANNED',
      w,
      reasons
        ? `Active FACEIT ban: ${reasons}`
        : 'Active FACEIT ban detected'
    );
    raw += w;
    banSignal = true;
  }

  // Account age — graduated, not a cliff at 365 days
  if (ageDays != null) {
    if (ageDays < 90) {
      const w = 28;
      push(
        flags,
        'NEW_ACCOUNT',
        w,
        `Steam account only ${Math.floor(ageDays)} days old`
      );
      raw += w;
      ageSignal = true;
    } else if (ageDays < 365) {
      // 90→365: 22 down to 12
      const t = (ageDays - 90) / (365 - 90);
      const w = Math.round(22 - t * 10);
      push(
        flags,
        'NEW_ACCOUNT',
        w,
        `Steam account ${Math.floor(ageDays)} days old (< 1 year)`
      );
      raw += w;
      ageSignal = true;
    } else if (ageYears != null && ageYears < 2) {
      const w = 8;
      push(
        flags,
        'YOUNG_ACCOUNT',
        w,
        `Steam account ${ageYears.toFixed(1)} years old`
      );
      raw += w;
    }
  }

  // Private profile — mild; many legit players hide stats
  if (steam.isPrivate) {
    const w = 6;
    push(
      flags,
      'HIDDEN_PROFILE',
      w,
      'Steam profile is private (limits verification of inventory, games, and history)'
    );
    raw += w;
  }

  // Low Steam level vs high CS hours — smurf / fresh curated account
  if (steam.level != null && hours != null && hours > 400) {
    if (steam.level <= 2 && hours > 800) {
      const w = 14;
      push(
        flags,
        'LOW_STEAM_LEVEL',
        w,
        `Steam level ${steam.level} with ${hours.toLocaleString()} CS hours — atypical for a long-term main`
      );
      raw += w;
      progressionSignal = true;
    } else if (steam.level < 5 && hours > 500) {
      const w = 9;
      push(
        flags,
        'LOW_STEAM_LEVEL',
        w,
        `Steam level ${steam.level} with ${hours.toLocaleString()} CS hours`
      );
      raw += w;
    }
  }

  // Composite smurf signature: young account + strong faceit + sparse social graph
  if (
    ageDays != null &&
    ageDays < 400 &&
    faceit &&
    faceit.level >= 8 &&
    (steam.friendCount == null || steam.friendCount < 15)
  ) {
    const w = 12;
    push(
      flags,
      'SMURF_SIGNATURE',
      w,
      `Young Steam account + FACEIT level ${faceit.level}${
        steam.friendCount != null ? ` + only ${steam.friendCount} friends` : ''
      }`
    );
    raw += w;
    ageSignal = true;
    progressionSignal = true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // STATISTICS (mechanical outliers)
  // ═════════════════════════════════════════════════════════════════════════

  // Headshot % — pro rifle HS% often ~45–55%; 60+ is rare sustained; 70+ extreme
  if (hs != null) {
    let w = 0;
    if (hs >= 75) w = 24;
    else if (hs >= 68) w = 18;
    else if (hs >= 62) w = 12;
    else if (hs >= 58) w = 6;
    if (w) {
      push(
        flags,
        'EXTREME_HEADSHOT',
        w,
        `Sustained headshot rate ${hs.toFixed(1)}% (typical high-level rifle: ~45–55%)`
      );
      raw += w;
      if (hs >= 65) aimbotishSignal = true;
    }
  }

  // Reaction time — elite humans ~180–220ms; sub-160 sustained is suspicious
  if (reaction != null && reaction > 0) {
    let w = 0;
    if (reaction < 140) w = 22;
    else if (reaction < 160) w = 16;
    else if (reaction < 175) w = 9;
    if (w) {
      push(
        flags,
        'INHUMAN_REACTIONS',
        w,
        `Avg reaction ${Math.round(reaction)}ms (typical human range ~200–250ms; elite ~180–220ms)`
      );
      raw += w;
      if (reaction < 160) aimbotishSignal = true;
    }
  }

  // Spray consistency
  if (spray != null) {
    let w = 0;
    if (spray >= 90) w = 16;
    else if (spray >= 85) w = 11;
    else if (spray >= 80) w = 6;
    if (w) {
      push(
        flags,
        'PERFECT_SPRAY',
        w,
        `Spray control ${spray.toFixed(1)}% — unusually consistent vs human variance`
      );
      raw += w;
      if (spray >= 88) aimbotishSignal = true;
    }
  }

  // Aim high, game-sense low — classic assistance pattern
  if (aim != null && positioning != null) {
    if (aim >= 80 && positioning <= 40) {
      const gap = aim - positioning;
      const w = clamp(Math.round(10 + gap * 0.18), 12, 26);
      push(
        flags,
        'SKILL_IMBALANCE',
        w,
        `Aim ${aim.toFixed(0)} with positioning ${positioning.toFixed(0)} — large aim/game-sense gap`
      );
      raw += w;
      aimbotishSignal = true;
    }
  }

  if (aim != null && utility != null) {
    if (aim >= 82 && utility <= 32) {
      const w = clamp(Math.round(8 + (aim - utility) * 0.12), 10, 20);
      push(
        flags,
        'AIM_UTILITY_GAP',
        w,
        `Aim ${aim.toFixed(0)} with utility ${utility.toFixed(0)} — rare for legit high-aim players`
      );
      raw += w;
    }
  }

  // FACEIT K/D vs sample size
  if (faceit && faceit.avgKD > 0 && faceit.matches > 0) {
    let w = 0;
    if (faceit.avgKD >= 1.9 && faceit.matches < 80) w = 18;
    else if (faceit.avgKD >= 1.7 && faceit.matches < 100) w = 14;
    else if (faceit.avgKD >= 1.55 && faceit.matches < 50) w = 10;
    if (w) {
      push(
        flags,
        'HIGH_KD_LOW_MATCHES',
        w,
        `FACEIT K/D ${faceit.avgKD.toFixed(2)} across only ${faceit.matches} matches`
      );
      raw += w;
      progressionSignal = true;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PERFORMANCE PATTERNS
  // ═════════════════════════════════════════════════════════════════════════

  if (cstrafe != null) {
    let w = 0;
    if (cstrafe >= 95) w = 15;
    else if (cstrafe >= 92) w = 11;
    else if (cstrafe >= 88) w = 6;
    if (w) {
      push(
        flags,
        'PERFECT_MOVEMENT',
        w,
        `Counter-strafe good-shot rate ${cstrafe.toFixed(1)}%`
      );
      raw += w;
      if (cstrafe >= 93) aimbotishSignal = true;
    }
  }

  // Opening duels — pro-level first-kill success is typically near coin-flip territory
  if (tOpen != null && tOpen >= 62) {
    let w = 0;
    if (tOpen >= 78) w = 16;
    else if (tOpen >= 70) w = 12;
    else w = 7;
    push(
      flags,
      'DOMINANT_T_ENTRIES',
      w,
      `T-side opening duel success ${tOpen.toFixed(1)}% (high-level play often ~50–58%)`
    );
    raw += w;
  }

  if (ctOpen != null && ctOpen >= 62) {
    let w = 0;
    if (ctOpen >= 78) w = 16;
    else if (ctOpen >= 70) w = 12;
    else w = 7;
    push(
      flags,
      'DOMINANT_CT_HOLDS',
      w,
      `CT-side opening duel success ${ctOpen.toFixed(1)}% (high-level play often ~48–55%)`
    );
    raw += w;
  }

  // Pre-aim offset (degrees) — lower is better; sub-5° average is very tight
  if (preaim != null && preaim >= 0) {
    let w = 0;
    if (preaim < 3) w = 14;
    else if (preaim < 4.5) w = 9;
    else if (preaim < 6) w = 5;
    if (w) {
      push(
        flags,
        'PERFECT_CROSSHAIR',
        w,
        `Avg pre-aim offset ${preaim.toFixed(1)}° — extremely tight crosshair placement`
      );
      raw += w;
      if (preaim < 4) aimbotishSignal = true;
    }
  }

  // New account dominating matchmaking / leetify sample
  if (leetify && ageDays != null && ageDays < 200) {
    const wr =
      leetify.winrate > 1 ? leetify.winrate / 100 : leetify.winrate;
    const matches = leetify.total_matches ?? 0;
    if (wr >= 0.62 && matches >= 25) {
      const w = wr >= 0.7 ? 18 : 12;
      push(
        flags,
        'NEW_ACCOUNT_DOMINATING',
        w,
        `${(wr * 100).toFixed(0)}% winrate over ${matches} matches on a ${Math.floor(ageDays)}-day-old Steam account`
      );
      raw += w;
      ageSignal = true;
      progressionSignal = true;
    }
  }

  // Sudden rating spikes in recent sample (leetify rating often −0.3…+0.3-ish scaled)
  if (leetify?.recent_matches && leetify.recent_matches.length >= 8) {
    const ratings = leetify.recent_matches
      .slice(0, 12)
      .map((m) => m.leetify_rating)
      .filter((x) => typeof x === 'number' && Number.isFinite(x));
    if (ratings.length >= 8) {
      const max = Math.max(...ratings);
      const min = Math.min(...ratings);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const span = max - min;
      // Large absolute swing with solid average
      if (span >= 0.45 && avg > 0.05) {
        const w = span >= 0.7 ? 12 : 8;
        push(
          flags,
          'RATING_SPIKE',
          w,
          `Wide recent form swing (leetify rating ${(min * 100).toFixed(0)} → ${(max * 100).toFixed(0)})`
        );
        raw += w;
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // BEHAVIORAL / PROGRESSION
  // ═════════════════════════════════════════════════════════════════════════

  if (faceit?.accountAge != null && faceit.level >= 1) {
    // accountAge is days in faceit service
    if (faceit.accountAge < 45 && faceit.level >= 9) {
      const w = 18;
      push(
        flags,
        'NEW_FACEIT_HIGH_LEVEL',
        w,
        `FACEIT account ${faceit.accountAge} days old at level ${faceit.level}`
      );
      raw += w;
      progressionSignal = true;
    } else if (faceit.accountAge < 90 && faceit.level >= 8) {
      const w = 12;
      push(
        flags,
        'NEW_FACEIT_HIGH_LEVEL',
        w,
        `FACEIT account ${faceit.accountAge} days old at level ${faceit.level}`
      );
      raw += w;
      progressionSignal = true;
    }
  }

  // Performance inconsistency across recent matches
  if (leetify?.recent_matches && leetify.recent_matches.length >= 10) {
    const ratings = leetify.recent_matches
      .slice(0, 10)
      .map((m) => m.leetify_rating)
      .filter((x) => typeof x === 'number');
    if (ratings.length >= 10) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance =
        ratings.reduce((s, r) => s + (r - avg) ** 2, 0) / ratings.length;
      const std = Math.sqrt(variance);
      // High std with decent mean = boom/bust
      if (std > 0.22 && avg > 0.02) {
        const w = std > 0.32 ? 12 : 8;
        push(
          flags,
          'INCONSISTENT_PERFORMANCE',
          w,
          `Unstable recent form (σ≈${(std * 100).toFixed(0)} rating points across last ${ratings.length} games)`
        );
        raw += w;
      }
    }
  }

  // Low hours, high competitive rank — use FACEIT level / aim, not misread leetify rank
  if (hours != null && hours > 0) {
    const faceitLvl = faceit?.level ?? 0;
    const strongAim = aim != null && aim >= 78;
    if (hours < 400 && (faceitLvl >= 9 || strongAim)) {
      const w = hours < 250 ? 16 : 11;
      push(
        flags,
        'LOW_HOURS_HIGH_SKILL',
        w,
        faceitLvl >= 9
          ? `Only ${hours} CS hours but FACEIT level ${faceitLvl}`
          : `Only ${hours} CS hours with aim rating ${aim!.toFixed(0)}`
      );
      raw += w;
      progressionSignal = true;
    } else if (hours < 700 && faceitLvl >= 10 && ageDays != null && ageDays < 500) {
      const w = 9;
      push(
        flags,
        'LOW_HOURS_HIGH_SKILL',
        w,
        `${hours} CS hours, FACEIT 10, Steam age ${Math.floor(ageDays!)} days`
      );
      raw += w;
      progressionSignal = true;
    }
  }

  // Side bias — relative CT/T leetify scores are often small fractions around 0
  if (ctRel != null && tRel != null) {
    const diff = Math.abs(ctRel - tRel);
    const peak = Math.max(Math.abs(ctRel), Math.abs(tRel));
    if (diff >= 0.12 && peak >= 0.08) {
      const better = ctRel > tRel ? 'CT' : 'T';
      const w = diff >= 0.2 ? 10 : 6;
      push(
        flags,
        'EXTREME_SIDE_BIAS',
        w,
        `Large ${better}-side bias (Δ ${(diff * 100).toFixed(1)} pts CT/T relative)`
      );
      raw += w;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // INTERACTION: independent red-flag families stacked
  // ═════════════════════════════════════════════════════════════════════════

  const families = [banSignal, ageSignal, aimbotishSignal, progressionSignal].filter(
    Boolean
  ).length;
  if (families >= 3) {
    const w = families >= 4 ? 14 : 9;
    push(
      flags,
      'STACKED_RED_FLAGS',
      w,
      `Multiple independent risk families co-occur (${families}/4: account bans, age/smurf, mechanical outliers, progression)`
    );
    raw += w;
  }

  // Sort flags by weight desc for UI
  flags.sort((a, b) => b.weight - a.weight);

  const totalScore = clamp(softCap(raw), 0, 100);

  let level: RiskAssessment['level'];
  if (totalScore >= 72) level = 'critical';
  else if (totalScore >= 48) level = 'high';
  else if (totalScore >= 26) level = 'medium';
  else level = 'low';

  // Hard overrides: active VAC + strong mechanical signal → at least high
  if (steam.vacBanned && aimbotishSignal && totalScore < 48) {
    level = 'high';
  }
  if ((steam.vacBanned || (faceit?.hasBan && faceit.activeBans?.length)) && totalScore < 30) {
    // Bans alone should never read as "low"
    return {
      totalScore: Math.max(totalScore, 34),
      level: totalScore >= 48 ? level : 'medium',
      flags,
      calculatedAt: new Date(),
    };
  }

  return {
    totalScore,
    level,
    flags,
    calculatedAt: new Date(),
  };
}

export function getRiskColor(score: number): string {
  if (score >= 72) return 'red';
  if (score >= 48) return 'orange';
  if (score >= 26) return 'yellow';
  return 'green';
}

export function getRiskLevelText(level: string): string {
  switch (level) {
    case 'critical':
      return 'CRITICAL THREAT';
    case 'high':
      return 'HIGH RISK';
    case 'medium':
      return 'MODERATE RISK';
    case 'low':
      return 'LOW RISK';
    default:
      return 'UNKNOWN';
  }
}

export function getFlagCategory(flag: string): RiskCategory {
  return RISK_FLAG_CATEGORIES[flag] ?? 'BEHAVIORAL';
}
