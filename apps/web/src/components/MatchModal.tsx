"use client";

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { MatchStats } from '@vantage/shared';
import {
  getMapDisplayName,
  getMapIcon,
  getSourceLogo,
  LOGOS,
} from '../lib/map-assets';

function sideIcon(side: 'ct' | 't' | 'neutral') {
  if (side === 'ct') return LOGOS.ct;
  if (side === 't') return LOGOS.t;
  return null;
}

export type FocusPlayer = {
  steam64?: string;
  nickname?: string;
  avatar?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  type: 'faceit' | 'leetify';
  loading?: boolean;
  focusPlayer?: FocusPlayer | null;
}

type Row = {
  id: string;
  name: string;
  avatar?: string;
  steam64?: string;
  k: number;
  d: number;
  a: number;
  kd: number;
  adr: number | null;
  hs: number | null;
  mvp: number | null;
  rating: number | null;
  multi: string | null;
};

type Team = {
  name: string;
  score: number;
  won: boolean;
  side: 'ct' | 't' | 'neutral';
  players: Row[];
};

export default function MatchModal({
  isOpen,
  onClose,
  match,
  type,
  loading,
  focusPlayer,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close scoreboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Match scoreboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-[720px] max-h-[100dvh] sm:max-h-[min(860px,90vh)] bg-[#101114] rounded-t-2xl sm:rounded-lg border-t sm:border border-[#2a2c32] shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            {/* mobile bottom-sheet drag handle */}
            <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-white/15" />
            </div>
            {loading || !match ? (
              <LoadingState onClose={onClose} />
            ) : (
              <Board
                match={match}
                type={type}
                focus={focusPlayer}
                onClose={onClose}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function LoadingState({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
      <div className="h-5 w-5 rounded-full border-2 border-[#3a3c44] border-t-[#c4c7ce] animate-spin" />
      <p className="text-sm text-[#8b8f98]">Loading scoreboard…</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 text-xs text-[#8b8f98] hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}

function Board({
  match,
  type,
  focus,
  onClose,
}: {
  match: any;
  type: 'faceit' | 'leetify';
  focus?: FocusPlayer | null;
  onClose: () => void;
}) {
  const mapName = getMapDisplayName(
    type === 'faceit' ? match.map : match.map_name
  );
  const mapIcon = getMapIcon(type === 'faceit' ? match.map : match.map_name);
  const sourceLogo =
    type === 'faceit' ? LOGOS.faceit : getSourceLogo(match.data_source || 'leetify');
  const sourceName =
    type === 'faceit'
      ? 'FACEIT'
      : String(match.data_source || match.matchmaking_source || 'Match').replace(
          /_/g,
          ' '
        );

  const when = (() => {
    const raw = type === 'faceit' ? match.date : match.finished_at;
    if (!raw) return null;
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  })();

  const duration =
    type === 'leetify' && match.duration_seconds
      ? formatDuration(match.duration_seconds)
      : null;

  const teams = useMemo(
    () => (type === 'faceit' ? fromFaceit(match) : fromLeetify(match)),
    [match, type]
  );

  const matchFocus = (p: Row) => {
    if (!focus) return false;
    if (focus.steam64 && p.steam64 && focus.steam64 === p.steam64) return true;
    if (focus.nickname && p.name.toLowerCase() === focus.nickname.toLowerCase())
      return true;
    return false;
  };

  // Put the team containing the focused player first
  const ordered = useMemo(() => {
    if (!teams.length) return teams;
    const idx = teams.findIndex((t) => t.players.some(matchFocus));
    if (idx <= 0) return teams;
    return [teams[idx], ...teams.filter((_, i) => i !== idx)];
  }, [teams, focus]);

  if (!ordered.length) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-[#8b8f98]">No scoreboard data for this match.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-white underline"
        >
          Close
        </button>
      </div>
    );
  }

  const [teamA, teamB] = [ordered[0], ordered[1]];

  return (
    <>
      {/* Header */}
      <header className="shrink-0 border-b border-[#2a2c32] bg-[#14161a]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={mapIcon}
              alt=""
              className="w-9 h-9 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/maps/icons/unknown.svg';
              }}
            />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#f0f1f3] truncate">
                {mapName}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-[#8b8f98] mt-0.5">
                <img src={sourceLogo} alt="" className="w-3 h-3 inline" />
                <span className="capitalize">{sourceName}</span>
                {when && (
                  <>
                    <span className="text-[#3a3c44]">·</span>
                    <span>{when}</span>
                  </>
                )}
                {duration && (
                  <>
                    <span className="text-[#3a3c44]">·</span>
                    <span>{duration}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 h-8 px-3 rounded text-xs font-medium text-[#c4c7ce] bg-[#1c1e24] border border-[#2a2c32] hover:bg-[#252830] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Final score */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 pb-4 pt-1">
          <SideLabel team={teamA} align="right" />
          <div className="flex items-baseline gap-2 tabular-nums">
            <span
              className={`text-[40px] sm:text-[48px] font-bold leading-none tracking-tight ${
                teamA?.won ? 'text-white' : 'text-[#6b6f78]'
              }`}
            >
              {teamA?.score ?? 0}
            </span>
            <span className="text-[#3a3c44] text-2xl font-light pb-1">:</span>
            <span
              className={`text-[40px] sm:text-[48px] font-bold leading-none tracking-tight ${
                teamB?.won ? 'text-white' : 'text-[#6b6f78]'
              }`}
            >
              {teamB?.score ?? 0}
            </span>
          </div>
          <SideLabel team={teamB} align="left" />
        </div>
      </header>

      {/* Teams */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {ordered.map((team, i) => (
          <TeamBlock
            key={i}
            team={team}
            isFaceit={type === 'faceit'}
            matchFocus={matchFocus}
            focusAvatar={focus?.avatar}
          />
        ))}
      </div>

      {(match.demo_url || match.replay_url || match.matchUrl) && (
        <footer className="shrink-0 border-t border-[#2a2c32] bg-[#14161a] px-4 py-2.5 flex flex-wrap gap-4">
          {match.demo_url && (
            <a
              href={match.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#c4c7ce] hover:text-white"
            >
              Demo
            </a>
          )}
          {match.replay_url && (
            <a
              href={match.replay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#c4c7ce] hover:text-white"
            >
              Replay
            </a>
          )}
          {match.matchUrl && (
            <a
              href={match.matchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#c4c7ce] hover:text-white"
            >
              FACEIT room
            </a>
          )}
        </footer>
      )}
    </>
  );
}

function SideLabel({
  team,
  align,
}: {
  team?: Team;
  align: 'left' | 'right';
}) {
  if (!team) return <div className="w-[4.5rem] sm:w-24" />;
  const color =
    team.side === 'ct'
      ? 'text-[#5b9fd4]'
      : team.side === 't'
        ? 'text-[#c9a227]'
        : 'text-[#c4c7ce]';

  const icon = sideIcon(team.side);

  return (
    <div
      className={`w-[4.5rem] sm:w-28 min-w-0 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <div
        className={`text-[11px] font-bold uppercase tracking-wider ${color} inline-flex items-center gap-1 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {icon && <img src={icon} alt="" className="w-4 h-4 shrink-0" />}
        {team.name}
      </div>
      <div className="text-[10px] mt-0.5 font-semibold uppercase tracking-wide">
        {team.won ? (
          <span className="text-[#3dd68c]">Win</span>
        ) : (
          <span className="text-[#6b6f78]">Loss</span>
        )}
      </div>
    </div>
  );
}

function TeamBlock({
  team,
  isFaceit,
  matchFocus,
  focusAvatar,
}: {
  team: Team;
  isFaceit: boolean;
  matchFocus: (p: Row) => boolean;
  focusAvatar?: string;
}) {
  const accent =
    team.side === 'ct'
      ? 'bg-[#5b9fd4]'
      : team.side === 't'
        ? 'bg-[#c9a227]'
        : 'bg-[#6b6f78]';
  const headBg =
    team.side === 'ct'
      ? 'bg-[#5b9fd4]/[0.07]'
      : team.side === 't'
        ? 'bg-[#c9a227]/[0.07]'
        : 'bg-white/[0.02]';

  const maxK = Math.max(...team.players.map((p) => p.k), 0);

  return (
    <section className="border-b border-[#2a2c32] last:border-0">
      <div
        className={`flex items-center justify-between px-3 sm:px-4 py-1.5 ${headBg}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-0.5 h-3.5 rounded-full ${accent}`} />
          {sideIcon(team.side) && (
            <img src={sideIcon(team.side)!} alt="" className="w-4 h-4 shrink-0" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c4c7ce]">
            {team.name}
          </span>
        </div>
        <span
          className={`text-lg font-bold tabular-nums ${
            team.won ? 'text-white' : 'text-[#6b6f78]'
          }`}
        >
          {team.score}
        </span>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6f78]">
            <th className="text-left font-semibold pl-3 sm:pl-4 pr-2 py-1.5">
              Player
            </th>
            <th className="text-right font-semibold px-1.5 py-1.5 w-8">K</th>
            <th className="text-right font-semibold px-1.5 py-1.5 w-8">A</th>
            <th className="text-right font-semibold px-1.5 py-1.5 w-8">D</th>
            <th className="text-right font-semibold px-1.5 py-1.5 w-10">+/-</th>
            <th className="text-right font-semibold px-1.5 py-1.5 w-11">K/D</th>
            {!isFaceit && (
              <th className="text-right font-semibold px-1.5 py-1.5 w-10">ADR</th>
            )}
            <th className="text-right font-semibold px-1.5 py-1.5 w-10">HS%</th>
            {!isFaceit && (
              <th className="text-right font-semibold px-1.5 pr-3 sm:pr-4 py-1.5 w-12">
                RTG
              </th>
            )}
            {isFaceit && (
              <th className="text-right font-semibold px-1.5 py-1.5 w-9">MVP</th>
            )}
            {isFaceit && (
              <th className="text-right font-semibold px-1.5 pr-3 sm:pr-4 py-1.5 w-14">
                3/4/5
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => {
            const you = matchFocus(p);
            const diff = p.k - p.d;
            const top = p.k === maxK && maxK > 0;
            const av = p.avatar || (you ? focusAvatar : undefined);

            return (
              <tr
                key={p.id}
                className={`border-t border-[#1a1c22] ${
                  you
                    ? 'bg-[#6d5cff]/[0.12]'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <td
                  className={`pl-3 sm:pl-4 pr-2 py-2 ${
                    you ? 'shadow-[inset_2px_0_0_0_#8b7cf7]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {av ? (
                      <img
                        src={av}
                        alt=""
                        className={`w-6 h-6 rounded-sm object-cover bg-[#1c1e24] shrink-0 ${
                          you ? 'ring-1 ring-[#8b7cf7]' : ''
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-sm bg-[#1c1e24] shrink-0 flex items-center justify-center text-[10px] font-bold text-[#6b6f78] ${
                          you ? 'ring-1 ring-[#8b7cf7]' : ''
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex items-center gap-1.5">
                      {p.steam64 ? (
                        <a
                          href={`/profile/${p.steam64}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[13px] font-medium truncate max-w-[9rem] sm:max-w-[14rem] hover:underline ${
                            you ? 'text-[#e4e0ff]' : 'text-[#e8e9ec]'
                          }`}
                        >
                          {p.name}
                        </a>
                      ) : (
                        <span
                          className={`text-[13px] font-medium truncate max-w-[9rem] sm:max-w-[14rem] ${
                            you ? 'text-[#e4e0ff]' : 'text-[#e8e9ec]'
                          }`}
                        >
                          {p.name}
                        </span>
                      )}
                      {you && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#c4b5fd] bg-[#6d5cff]/25 px-1 py-px rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className={`text-right tabular-nums text-[13px] px-1.5 py-2 ${
                    top ? 'text-white font-bold' : 'text-[#e8e9ec] font-medium'
                  }`}
                >
                  {p.k}
                </td>
                <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#8b8f98]">
                  {p.a}
                </td>
                <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#8b8f98]">
                  {p.d}
                </td>
                <td
                  className={`text-right tabular-nums text-[13px] px-1.5 py-2 font-medium ${
                    diff > 0
                      ? 'text-[#3dd68c]'
                      : diff < 0
                        ? 'text-[#f07178]'
                        : 'text-[#6b6f78]'
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#c4c7ce]">
                  {p.kd.toFixed(2)}
                </td>
                {!isFaceit && (
                  <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#c4c7ce]">
                    {p.adr != null ? Math.round(p.adr) : '—'}
                  </td>
                )}
                <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#c4c7ce]">
                  {p.hs != null ? `${Math.round(p.hs)}` : '—'}
                </td>
                {!isFaceit && (
                  <td
                    className={`text-right tabular-nums text-[13px] px-1.5 pr-3 sm:pr-4 py-2 font-semibold ${
                      p.rating == null
                        ? 'text-[#6b6f78]'
                        : p.rating >= 0
                          ? 'text-[#3dd68c]'
                          : 'text-[#f07178]'
                    }`}
                  >
                    {p.rating != null
                      ? `${p.rating >= 0 ? '+' : ''}${(p.rating * 100).toFixed(0)}`
                      : '—'}
                  </td>
                )}
                {isFaceit && (
                  <td className="text-right tabular-nums text-[13px] px-1.5 py-2 text-[#c4c7ce]">
                    {p.mvp ?? '—'}
                  </td>
                )}
                {isFaceit && (
                  <td className="text-right tabular-nums text-[11px] px-1.5 pr-3 sm:pr-4 py-2 text-[#6b6f78]">
                    {p.multi ?? '—'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
}

/* ── data ─────────────────────────────────────────────────── */

function fromFaceit(match: MatchStats): Team[] {
  const t = match.teams;
  if (!t?.team1 || !t?.team2) return [];

  const build = (team: any, name: string, side: Team['side']): Team => {
    const score = Number(team.score) || 0;
    const players: Row[] = [...(team.players || [])]
      .map((p: any, i: number) => {
        const k = n(p.kills);
        const d = n(p.deaths);
        const a = n(p.assists);
        return {
          id: p.playerId || `f${i}`,
          name: p.nickname || 'Unknown',
          avatar: p.avatar,
          steam64: undefined,
          k,
          d,
          a,
          kd: n(p.kd) || (d > 0 ? k / d : k),
          adr: null,
          hs: p.hsPercent != null ? n(p.hsPercent) : null,
          mvp: p.mvps != null ? n(p.mvps) : null,
          rating: null,
          multi:
            p.tripleKills != null
              ? `${n(p.tripleKills)}/${n(p.quadroKills)}/${n(p.pentaKills)}`
              : null,
        };
      })
      .sort((a, b) => b.k - a.k || b.kd - a.kd);

    const other =
      team === t.team1 ? Number(t.team2.score) || 0 : Number(t.team1.score) || 0;
    const won =
      team.won != null ? !!team.won : score > other;

    return {
      name: cleanName(team.name, name),
      score,
      won: score === other ? false : won,
      side,
      players,
    };
  };

  const a = build(t.team1, 'Team A', 'neutral');
  const b = build(t.team2, 'Team B', 'neutral');
  // mark sole winner
  if (a.score !== b.score) {
    a.won = a.score > b.score;
    b.won = b.score > a.score;
  }
  return [a, b];
}

function fromLeetify(match: any): Team[] {
  const stats: any[] = match.stats || [];
  if (!stats.length) return [];

  const nums = Array.from(
    new Set(stats.map((p) => p.initial_team_number).filter((x) => x != null))
  ).sort((a: any, b: any) => a - b) as number[];

  const sides = nums.length >= 2 ? nums.slice(0, 2) : nums.length === 1 ? [nums[0]] : [2, 3];

  return sides.map((teamNum, idx) => {
    const rows = stats.filter((p) => p.initial_team_number === teamNum);
    const score =
      match.team_scores?.find((s: any) => s.team_number === teamNum)?.score ?? 0;
    const other =
      match.team_scores?.find((s: any) => s.team_number !== teamNum)?.score ?? 0;

    const players: Row[] = rows
      .map((p: any, i: number) => {
        const k = n(p.total_kills ?? p.kills);
        const d = n(p.total_deaths ?? p.deaths);
        const a = n(p.total_assists ?? p.assists);
        let hs: number | null = null;
        if (p.accuracy_head != null) {
          const h = n(p.accuracy_head);
          hs = h <= 1 ? h * 100 : h;
        } else if (p.total_hs_kills != null && k > 0) {
          hs = (n(p.total_hs_kills) / k) * 100;
        }
        return {
          id: p.steam64_id || `l${i}`,
          name: p.steam_username || p.nickname || p.name || 'Unknown',
          avatar: p.avatar,
          steam64: p.steam64_id,
          k,
          d,
          a,
          kd: n(p.kd_ratio) || (d > 0 ? k / d : k),
          adr:
            p.dpr != null
              ? n(p.dpr)
              : p.damage_per_round != null
                ? n(p.damage_per_round)
                : null,
          hs,
          mvp: p.mvps != null ? n(p.mvps) : null,
          rating: p.leetify_rating != null ? n(p.leetify_rating) : null,
          multi: null,
        };
      })
      .sort((a, b) => b.k - a.k || (b.adr ?? 0) - (a.adr ?? 0));

    // Leetify often uses 2/3 for CT/T
    const side: Team['side'] =
      teamNum === 2 ? 'ct' : teamNum === 3 ? 't' : 'neutral';
    const name =
      side === 'ct' ? 'CT' : side === 't' ? 'T' : idx === 0 ? 'Team A' : 'Team B';

    return {
      name,
      score: Number(score) || 0,
      won: Number(score) > Number(other),
      side,
      players,
    };
  });
}

function cleanName(name: any, fallback: string) {
  if (!name || typeof name !== 'string') return fallback;
  if (name.length > 20 || /^[0-9a-f-]{16,}$/i.test(name)) return fallback;
  return name;
}

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
