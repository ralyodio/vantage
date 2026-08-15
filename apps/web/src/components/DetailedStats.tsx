"use client";

import { motion } from 'framer-motion';
import type { UserProfile } from '@vantage/shared';
import { LOGOS } from '../lib/map-assets';

/**
 * Analytics = deep Leetify-only signals not shown in the profile hero/KPIs/platform cards.
 * No Faceit ELO, Steam K/D, Aim/Pos/Util rings, ranks, hours, etc. (those live above).
 */

function rawPct(v?: number | null) {
  if (v == null || Number.isNaN(v)) return 0;
  let n = v;
  if (n > 100) n = n / 100;
  if (n > 0 && n <= 1) n = n * 100;
  return Math.min(Math.max(n, 0), 100);
}

export default function DetailedStats({ profile }: { profile: UserProfile }) {
  const stats = profile.leetify?.stats;
  const teammates = profile.leetify?.recent_teammates?.slice(0, 4) ?? [];

  if (!stats && !teammates.length) return null;

  const mechanics = stats
    ? [
        {
          label: 'HS%',
          value: fmtPct(stats.accuracy_head),
          pct: rawPct(stats.accuracy_head),
        },
        {
          label: 'Spray',
          value: fmtPct(stats.spray_accuracy),
          pct: rawPct(stats.spray_accuracy),
        },
        {
          label: 'C-strafe',
          value: fmtPct(stats.counter_strafing_good_shots_ratio),
          pct: rawPct(stats.counter_strafing_good_shots_ratio),
        },
        {
          label: 'Spotted',
          value: fmtPct(stats.accuracy_enemy_spotted),
          pct: rawPct(stats.accuracy_enemy_spotted),
        },
        {
          label: 'Reaction',
          value:
            stats.reaction_time_ms != null
              ? `${Math.round(stats.reaction_time_ms)}ms`
              : '—',
          pct: null as number | null,
        },
        {
          label: 'Preaim',
          value: stats.preaim != null ? `${Number(stats.preaim).toFixed(1)}°` : '—',
          pct: null as number | null,
        },
        {
          label: 'Trade %',
          value: fmtPct(stats.trade_kills_success_percentage),
          pct: rawPct(stats.trade_kills_success_percentage),
        },
        {
          label: 'Util dmg',
          value:
            stats.he_foes_damage_avg != null
              ? Number(stats.he_foes_damage_avg).toFixed(1)
              : '—',
          pct: null as number | null,
        },
        {
          label: 'Flash → kill',
          value:
            stats.flashbang_leading_to_kill != null
              ? String(Math.round(Number(stats.flashbang_leading_to_kill)))
              : '—',
          pct: null as number | null,
        },
      ]
    : [];

  // Pad to multiple of 3 for even grid
  while (mechanics.length % 3 !== 0 && mechanics.length > 0) {
    mechanics.push({ label: '', value: '', pct: null });
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 shrink-0">
          Analytics
        </h2>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-zinc-600 shrink-0">Leetify deep stats</span>
      </header>

      <div className="rounded-xl border border-white/[0.08] bg-[#111113] overflow-hidden divide-y divide-white/[0.06]">
        {mechanics.length > 0 && (
          <div>
            <div className="px-3 sm:px-4 py-2 bg-[#14161a] border-b border-white/[0.05]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Aim & utility
              </span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/[0.05]">
              {mechanics.map((s, i) =>
                s.label ? (
                  <div key={s.label} className="bg-[#111113] px-3 py-3">
                    <div className="flex items-baseline justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 truncate">
                        {s.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-zinc-100 shrink-0">
                        {s.value}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      {s.pct != null ? (
                        <motion.div
                          className="h-full rounded-full bg-zinc-400/70"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${s.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div key={`pad-${i}`} className="bg-[#111113]" aria-hidden />
                )
              )}
            </div>
          </div>
        )}

        {stats && (
          <div>
            <div className="px-3 sm:px-4 py-2 bg-[#14161a] border-b border-white/[0.05]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Opening duels
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.05]">
              <OpeningBlock
                side="T"
                winRate={stats.t_opening_duel_success_percentage}
                aggression={stats.t_opening_aggression_success_rate}
              />
              <OpeningBlock
                side="CT"
                winRate={stats.ct_opening_duel_success_percentage}
                aggression={stats.ct_opening_aggression_success_rate}
              />
            </div>
          </div>
        )}

        {teammates.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#14161a] border-b border-white/[0.05]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Teammates
              </span>
              <span className="text-[10px] tabular-nums text-zinc-600">
                {teammates.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05]">
              {teammates.map((t) => (
                <a
                  key={t.steam64_id}
                  href={`/profile/${t.steam64_id}`}
                  className="flex items-center gap-2.5 bg-[#111113] px-3 py-2.5 hover:bg-[#16181d] transition-colors min-w-0"
                >
                  <img
                    src={
                      t.avatar ||
                      'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
                    }
                    alt=""
                    className="w-7 h-7 rounded object-cover bg-zinc-800 ring-1 ring-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-100 truncate">
                      {t.name || `…${t.steam64_id.slice(-6)}`}
                    </div>
                    <div className="text-[10px] text-zinc-500 tabular-nums">
                      {t.recent_matches_count} games
                    </div>
                  </div>
                </a>
              ))}
              {teammates.length < 4 &&
                Array.from({ length: 4 - teammates.length }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="hidden sm:block bg-[#111113]"
                    aria-hidden
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OpeningBlock({
  side,
  winRate,
  aggression,
}: {
  side: 'T' | 'CT';
  winRate?: number;
  aggression?: number;
}) {
  const win = rawPct(winRate);
  const agr = rawPct(aggression);

  return (
    <div className="bg-[#111113] px-4 py-4">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            <img
              src={side === 'T' ? LOGOS.t : LOGOS.ct}
              alt=""
              className="w-4 h-4 shrink-0"
            />
            {side === 'T' ? 'Terrorist' : 'Counter-Terrorist'}
          </div>
          <div className="text-[10px] text-zinc-600 mt-0.5">Opening win rate</div>
        </div>
        <div className="text-2xl font-semibold tabular-nums text-zinc-50 leading-none">
          {win.toFixed(0)}
          <span className="text-sm text-zinc-500 font-medium">%</span>
        </div>
      </div>
      <div className="space-y-3">
        <BarRow label="Win rate" value={win} />
        <BarRow label="Aggression" value={agr} muted />
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-zinc-500 uppercase tracking-wide font-medium">{label}</span>
        <span className="tabular-nums text-zinc-400">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${muted ? 'bg-zinc-600' : 'bg-zinc-300'}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function fmtPct(v?: number | null) {
  if (v == null || Number.isNaN(v)) return '—';
  let n = v;
  if (n > 100) n = n / 100;
  if (n > 0 && n <= 1) n = n * 100;
  return `${n.toFixed(0)}%`;
}
