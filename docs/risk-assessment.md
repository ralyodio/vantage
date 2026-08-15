# Vantage Threat Assessment

## Overview

The threat score is a **0–100 soft-capped multi-signal model**. It is **not** a VAC verdict or proof of cheating — it ranks how many independent red flags appear in public Steam / FACEIT / Leetify data.

| Level | Score | Meaning |
|-------|-------|---------|
| Low | 0–25 | Few or mild signals |
| Medium | 26–47 | Notable concerns |
| High | 48–71 | Several strong signals |
| Critical | 72–100 | Severe stack (bans + mechanics / smurf pattern) |

Implementation: `packages/shared/src/risk-calculator.ts` → `calculateRiskScore()`.

## Design principles (v2)

1. **Graduated weights** — thresholds scale (e.g. HS% 58 → 62 → 68 → 75), not single cliffs.
2. **Normalize Leetify fields** — stats/ratings accepted as **0–1 or 0–100**.
3. **Soft-cap** — raw points map through `100 * (1 - exp(-raw/55))` so three medium flags no longer auto-100.
4. **Interaction bonus** — when 3–4 independent families co-occur (bans, age/smurf, mechanical outliers, progression), add `STACKED_RED_FLAGS`.
5. **Ban floor** — active VAC/FACEIT ban alone never reads as “low”.
6. **Fixed rank misuse** — `LOW_HOURS_HIGH_SKILL` uses FACEIT level / aim score, not a misinterpreted Leetify percentile.

## Signal families

### Account
| Flag | Notes |
|------|--------|
| `VAC_BANNED` | ~42–55 by recency |
| `GAME_BANNED` | ~22–28 |
| `COMMUNITY_BANNED` | mild |
| `FACEIT_BANNED` | active bans |
| `NEW_ACCOUNT` / `YOUNG_ACCOUNT` | graduated by days/years |
| `HIDDEN_PROFILE` | mild (many legit privates) |
| `LOW_STEAM_LEVEL` | level vs CS hours |
| `SMURF_SIGNATURE` | young + high FACEIT + sparse friends |

### Mechanics (statistics)
| Flag | Notes |
|------|--------|
| `EXTREME_HEADSHOT` | vs ~45–55% high-level rifle baseline |
| `INHUMAN_REACTIONS` | vs ~200–250ms human / ~180–220 elite |
| `PERFECT_SPRAY` | extreme consistency |
| `SKILL_IMBALANCE` | high aim, low positioning |
| `AIM_UTILITY_GAP` | high aim, tiny utility |
| `HIGH_KD_LOW_MATCHES` | FACEIT K/D vs sample size |

### Performance
| Flag | Notes |
|------|--------|
| `PERFECT_MOVEMENT` | counter-strafe ratio |
| `DOMINANT_T_ENTRIES` / `DOMINANT_CT_HOLDS` | opening duel success |
| `PERFECT_CROSSHAIR` | pre-aim degrees (lower = tighter) |
| `NEW_ACCOUNT_DOMINATING` | winrate + young Steam |
| `RATING_SPIKE` | wide recent Leetify form swing |

### Behavioral
| Flag | Notes |
|------|--------|
| `NEW_FACEIT_HIGH_LEVEL` | days vs level |
| `INCONSISTENT_PERFORMANCE` | high σ on recent ratings |
| `LOW_HOURS_HIGH_SKILL` | hours vs FACEIT 9–10 / high aim |
| `EXTREME_SIDE_BIAS` | CT/T relative gap |
| `STACKED_RED_FLAGS` | multi-family co-occurrence |

## Pipeline

1. Collect Steam + FACEIT + Leetify (partial OK).
2. Evaluate flags with normalized inputs.
3. Sum raw weights; soft-cap to 0–100.
4. Assign level; apply ban floor / VAC+mechanics override.
5. Sort flags by weight for UI.

## UI

`RiskMeter` groups flags via `getFlagCategory()` from `@vantage/shared` (no hardcoded obsolete flag lists).

## Limitations

- Public APIs only; no demo/kernel proof.
- Smurfs and aimers can look similar on stats alone.
- Private Leetify/Steam reduces signal quality.
- Recalculate after **Refresh All** so cached profiles pick up the new formula.
