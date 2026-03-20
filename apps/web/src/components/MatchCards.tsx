"use client";

import { AnimatePresence, motion } from 'framer-motion';
import type { LeetifyRecentMatch } from '@vantage/shared';
import {
  getMapBanner,
  getMapDisplayName,
  getMapIcon,
  getSourceLogo,
  LOGOS,
} from '../lib/map-assets';

const expandEase = [0.22, 1, 0.36, 1] as const;

const heightTransition = {
  height: { duration: 0.42, ease: expandEase },
  opacity: { duration: 0.32, ease: expandEase },
};

const contentTransition = {
  duration: 0.36,
  ease: expandEase,
  delay: 0.03,
};

const iconTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 30,
  mass: 0.65,
};

type Outcome = 'win' | 'loss' | 'tie';

function outcomeStyles(outcome: Outcome) {
  if (outcome === 'win') {
    return {
      // Wider dissolve, lower opacity — soft left edge only
      edge:
        'bg-[linear-gradient(90deg,rgba(52,211,153,0.38)_0%,rgba(52,211,153,0.14)_40%,rgba(52,211,153,0.04)_75%,transparent_100%)]',
      score: 'text-emerald-300',
      pill: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30',
      label: 'Victory',
    };
  }
  if (outcome === 'loss') {
    return {
      edge:
        'bg-[linear-gradient(90deg,rgba(251,113,133,0.38)_0%,rgba(251,113,133,0.14)_40%,rgba(251,113,133,0.04)_75%,transparent_100%)]',
      score: 'text-rose-300',
      pill: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30',
      label: 'Defeat',
    };
  }
  return {
    edge:
      'bg-[linear-gradient(90deg,rgba(252,211,77,0.34)_0%,rgba(252,211,77,0.12)_40%,rgba(252,211,77,0.03)_75%,transparent_100%)]',
    score: 'text-amber-200',
    pill: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30',
    label: 'Draw',
  };
}

/** Full-bleed blurred map + dark scrim for readable type/icons */
function MapBackdrop({ banner }: { banner: string }) {
  return (
    <>
      <img
        src={banner}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl saturate-125"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/maps/thumbs/unknown.svg';
        }}
      />
      {/* Sharp subtle layer for depth without competing with text */}
      <img
        src={banner}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/maps/thumbs/unknown.svg';
        }}
      />
      {/* Contrast scrim — dark left→right so white text always reads */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
    </>
  );
}

function SourceBadge({
  logo,
  label,
  accent,
  mono,
}: {
  logo: string;
  label: string;
  accent?: string;
  /** Force monochrome white glyph (Steam / CS marks) */
  mono?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-100 ring-1 ring-white/20 backdrop-blur-sm"
      style={accent ? { boxShadow: `inset 0 0 0 1px ${accent}44` } : undefined}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 ring-1 ring-white/15">
        <img
          src={logo}
          alt=""
          className={`h-3 w-3 shrink-0 object-contain drop-shadow ${
            mono ? 'brightness-0 invert' : ''
          }`}
        />
      </span>
      <span className="text-zinc-50">{label}</span>
    </span>
  );
}

function MapIconBadge({ icon }: { icon: string }) {
  return (
    <img
      src={icon}
      alt=""
      className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:h-11 sm:w-11"
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/maps/icons/unknown.svg';
      }}
    />
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label?: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-md bg-black/45 px-2 py-1 ring-1 ring-white/10 backdrop-blur-sm">
      {label && (
        <div className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </div>
      )}
      <div
        className={`text-xs font-semibold tabular-nums ${tone || 'text-zinc-50'}`}
      >
        {value}
      </div>
    </div>
  );
}

function findPlayerStats(match: any, steamId?: string) {
  if (!steamId || !Array.isArray(match?.stats)) return null;
  const sid = String(steamId);
  return (
    match.stats.find((p: any) => String(p.steam64_id) === sid) ||
    match.stats.find(
      (p: any) =>
        p.steam64_id != null && String(p.steam64_id).endsWith(sid.slice(-10))
    ) ||
    null
  );
}

function resolveScores(match: any, player: any): {
  myScore: number;
  enemyScore: number;
  outcome: Outcome;
} {
  if (player && Array.isArray(match.team_scores) && match.team_scores.length) {
    const teamIdx = player.initial_team_number;
    const myScore =
      match.team_scores.find((t: any) => t.team_number === teamIdx)?.score ?? 0;
    const enemyScore =
      match.team_scores.find((t: any) => t.team_number !== teamIdx)?.score ?? 0;
    const outcome: Outcome =
      myScore > enemyScore ? 'win' : myScore < enemyScore ? 'loss' : 'tie';
    return { myScore, enemyScore, outcome };
  }

  // Fallback: score array from recent_matches / partial history
  if (Array.isArray(match.score) && match.score.length >= 2) {
    const a = Number(match.score[0]) || 0;
    const b = Number(match.score[1]) || 0;
    if (match.outcome === 'win') {
      return {
        myScore: Math.max(a, b),
        enemyScore: Math.min(a, b),
        outcome: 'win',
      };
    }
    if (match.outcome === 'loss') {
      return {
        myScore: Math.min(a, b),
        enemyScore: Math.max(a, b),
        outcome: 'loss',
      };
    }
    return { myScore: a, enemyScore: b, outcome: 'tie' };
  }

  if (typeof match.score === 'string' && match.score.includes('-')) {
    const [a, b] = match.score.split('-').map((x: string) => Number(x.trim()) || 0);
    return { myScore: a, enemyScore: b, outcome: a === b ? 'tie' : a > b ? 'win' : 'loss' };
  }

  return { myScore: 0, enemyScore: 0, outcome: 'tie' };
}

export function LeetifyMatchCard({
  match,
  steamId,
  expanded,
  onToggle,
  onViewScoreboard,
}: any) {
  const player = findPlayerStats(match, steamId);
  const hasPlayer = !!player;
  const { myScore, enemyScore, outcome } = resolveScores(match, player);
  const styles = outcomeStyles(outcome);
  const mapLabel = getMapDisplayName(match.map_name || match.map);
  const banner = getMapBanner(match.map_name || match.map);
  const icon = getMapIcon(match.map_name || match.map);
  const sourceLogo = getSourceLogo(match.data_source || 'matchmaking');
  const sourceLabel = String(match.data_source || 'matchmaking');
  const rating =
    player?.leetify_rating ??
    match.leetify_rating ??
    0;
  const finishedAt = match.finished_at || match.date;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/40">
      <div className="absolute inset-0">
        <MapBackdrop banner={banner} />
      </div>

      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-20 ${styles.edge}`}
        aria-hidden
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (hasPlayer) onToggle();
          else onViewScoreboard();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasPlayer) onToggle();
            else onViewScoreboard();
          }
        }}
        className="relative z-10 flex min-h-[5.25rem] cursor-pointer items-center gap-3 px-3 py-3 pl-4 outline-none transition-[background] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30 sm:gap-4 sm:px-4 sm:py-3.5 sm:pl-5"
      >
        <MapIconBadge icon={icon} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-white drop-shadow sm:text-base">
              {mapLabel}
            </h3>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.pill}`}
            >
              {styles.label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SourceBadge
              logo={sourceLogo}
              label={sourceLabel}
              mono={!String(match.data_source || '').toLowerCase().includes('faceit')}
            />
            <span className="text-[11px] font-medium text-zinc-300">
              {finishedAt ? new Date(finishedAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <div
            className={`text-xl font-bold tabular-nums tracking-tight drop-shadow sm:text-2xl ${styles.score}`}
          >
            {myScore}
            <span className="mx-0.5 font-medium text-white/35">:</span>
            <span className="font-semibold text-white/80">{enemyScore}</span>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            <StatChip
              label="Rating"
              value={
                hasPlayer || match.leetify_rating != null
                  ? `${rating > 0 ? '+' : ''}${(Number(rating) * 100).toFixed(0)}`
                  : '—'
              }
              tone={
                rating > 0
                  ? 'text-emerald-300'
                  : rating < 0
                    ? 'text-rose-300'
                    : 'text-zinc-50'
              }
            />
            <StatChip
              label="K/D"
              value={
                hasPlayer ? Number(player.kd_ratio ?? 0).toFixed(2) : '—'
              }
              tone="text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewScoreboard();
              }}
              className="hidden rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20 sm:inline-flex"
            >
              Scoreboard
            </button>
            {hasPlayer && (
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-sm font-medium text-white/80 ring-1 ring-white/15">
                <motion.span
                  animate={{ rotate: expanded ? 45 : 0 }}
                  transition={iconTransition}
                  className="inline-flex leading-none will-change-transform"
                >
                  +
                </motion.span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile secondary stats */}
      <div className="relative z-10 flex gap-1.5 border-t border-white/10 bg-black/35 px-3 py-2 sm:hidden">
        <StatChip
          label="Rating"
          value={
            hasPlayer || match.leetify_rating != null
              ? `${rating > 0 ? '+' : ''}${(Number(rating) * 100).toFixed(0)}`
              : '—'
          }
          tone={
            rating > 0
              ? 'text-emerald-300'
              : rating < 0
                ? 'text-rose-300'
                : 'text-zinc-50'
          }
        />
        <StatChip
          label="K/D"
          value={hasPlayer ? Number(player.kd_ratio ?? 0).toFixed(2) : '—'}
          tone="text-white"
        />
        <StatChip
          label="K-D-A"
          value={
            hasPlayer
              ? `${player.total_kills ?? 0}/${player.total_deaths ?? 0}/${player.total_assists ?? 0}`
              : '—'
          }
          tone="text-white"
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasPlayer && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={heightTransition}
            className="relative z-10 overflow-hidden will-change-[height,opacity]"
          >
            <div className="border-t border-white/10 bg-black/55 px-3 py-3 backdrop-blur-md sm:px-4">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={contentTransition}
              >
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <Col
                    title="Combat"
                    rows={[
                      ['K', player.total_kills],
                      ['D', player.total_deaths],
                      ['A', player.total_assists],
                      ['ADR', player.dpr?.toFixed?.(0)],
                    ]}
                  />
                  <Col
                    title="Aim"
                    rows={[
                      [
                        'HS%',
                        `${((player.accuracy_head || 0) * 100).toFixed(0)}%`,
                      ],
                      ['Preaim', player.preaim?.toFixed?.(0)],
                      [
                        'React',
                        `${((player.reaction_time || 0) * 1000).toFixed(0)}ms`,
                      ],
                      [
                        'Spray',
                        `${((player.spray_accuracy || 0) * 100).toFixed(0)}%`,
                      ],
                    ]}
                  />
                  <Col
                    title="Utility"
                    rows={[
                      ['Flash', player.flash_assist],
                      [
                        'Trade',
                        `${((player.trade_kills_success_percentage || 0) * 100).toFixed(0)}%`,
                      ],
                    ]}
                  />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1.5 font-medium">
                      Sides
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2 items-center">
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <img src={LOGOS.ct} alt="" className="w-3.5 h-3.5" />
                          CT
                        </span>
                        <span className="font-medium tabular-nums text-zinc-50">
                          {player.ct_leetify_rating != null
                            ? (player.ct_leetify_rating * 100).toFixed(0)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 items-center">
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <img src={LOGOS.t} alt="" className="w-3.5 h-3.5" />
                          T
                        </span>
                        <span className="font-medium tabular-nums text-zinc-50">
                          {player.t_leetify_rating != null
                            ? (player.t_leetify_rating * 100).toFixed(0)
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onViewScoreboard}
                    className="rounded-lg bg-white/12 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 sm:hidden"
                  >
                    Open scoreboard
                  </button>
                  {match.demo_url && (
                    <a
                      href={match.demo_url}
                      className="rounded-lg bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-zinc-100 ring-1 ring-white/15 hover:bg-black/55"
                    >
                      Download demo
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function FaceitMatchCard({ match, onViewScoreboard }: any) {
  const isWin = match.result === 'win';
  const outcome: Outcome = isWin ? 'win' : 'loss';
  const styles = outcomeStyles(outcome);
  const mapLabel = getMapDisplayName(match.map);
  const banner = getMapBanner(match.map);
  const icon = getMapIcon(match.map);
  const elo = match.eloChange;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-black/40">
      <div className="absolute inset-0">
        <MapBackdrop banner={banner} />
      </div>

      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-20 ${styles.edge}`}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[5.25rem] items-center gap-3 px-3 py-3 pl-4 sm:gap-4 sm:px-4 sm:py-3.5 sm:pl-5">
        <MapIconBadge icon={icon} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-white drop-shadow sm:text-base">
              {mapLabel}
            </h3>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.pill}`}
            >
              {styles.label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <SourceBadge logo={LOGOS.faceit} label="FACEIT" accent="#FF5500" />
            <span className="text-[11px] font-medium text-zinc-300">
              {match.date ? new Date(match.date).toLocaleDateString() : ''}
              {match.gameMode ? ` · ${match.gameMode}` : ''}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <div
            className={`text-xl font-bold tabular-nums tracking-tight drop-shadow sm:text-2xl ${styles.score}`}
          >
            {match.score}
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            <StatChip
              label="K-D-A"
              value={`${match.kills}/${match.deaths}/${match.assists ?? 0}`}
              tone="text-white"
            />
            <StatChip
              label="K/D"
              value={Number(match.kd).toFixed(2)}
              tone="text-white"
            />
            {elo != null && (
              <StatChip
                label="ELO"
                value={`${elo > 0 ? '+' : ''}${elo}`}
                tone={elo > 0 ? 'text-emerald-300' : 'text-rose-300'}
              />
            )}
          </div>

          <button
            type="button"
            onClick={onViewScoreboard}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
          >
            Scoreboard
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-1.5 border-t border-white/10 bg-black/35 px-3 py-2 sm:hidden">
        <StatChip
          label="K-D-A"
          value={`${match.kills}/${match.deaths}/${match.assists ?? 0}`}
          tone="text-white"
        />
        <StatChip
          label="K/D"
          value={Number(match.kd).toFixed(2)}
          tone="text-white"
        />
        {elo != null && (
          <StatChip
            label="ELO"
            value={`${elo > 0 ? '+' : ''}${elo}`}
            tone={elo > 0 ? 'text-emerald-300' : 'text-rose-300'}
          />
        )}
        {match.hsPercent != null && (
          <StatChip label="HS%" value={`${match.hsPercent}%`} tone="text-white" />
        )}
      </div>
    </article>
  );
}

export function LeetifyRecentMatchCard({ match }: { match: LeetifyRecentMatch }) {
  const outcome: Outcome =
    match.outcome === 'win' ? 'win' : match.outcome === 'loss' ? 'loss' : 'tie';
  const styles = outcomeStyles(outcome);
  const mapLabel = getMapDisplayName(match.map_name);
  const banner = getMapBanner(match.map_name);
  const icon = getMapIcon(match.map_name);
  const sourceLogo = getSourceLogo(match.data_source);

  return (
    <article className="relative overflow-hidden rounded-xl border border-white/10 ring-1 ring-black/40">
      <div className="absolute inset-0">
        <MapBackdrop banner={banner} />
      </div>
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-20 ${styles.edge}`}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-3 px-3 py-2.5 pl-4">
        <MapIconBadge icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{mapLabel}</div>
          <div className="mt-1">
            <SourceBadge
              logo={sourceLogo}
              label={String(match.data_source || 'leetify')}
              mono={!String(match.data_source || '').toLowerCase().includes('faceit')}
            />
          </div>
        </div>
        <span className="text-sm font-semibold tabular-nums text-white">
          {Array.isArray(match.score) ? match.score.join(':') : match.score}
        </span>
        <span
          className={`text-xs font-bold tabular-nums ${
            match.leetify_rating > 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {match.leetify_rating > 0 ? '+' : ''}
          {(match.leetify_rating * 100).toFixed(0)}
        </span>
      </div>
    </article>
  );
}

function Col({ title, rows }: { title: string; rows: [string, any][] }) {
  return (
    <div className="rounded-lg bg-black/40 p-2.5 ring-1 ring-white/10">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
        {title}
      </div>
      <div className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-zinc-400">{k}</span>
            <span className="font-medium tabular-nums text-zinc-50">{v ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
