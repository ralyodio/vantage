"use client";

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HiX, HiOutlineExternalLink } from 'react-icons/hi';
import type { MatchStats } from '@vantage/shared';
import {
  getMapBanner,
  getMapDisplayName,
  getMapIcon,
  getSourceLogo,
  LOGOS,
} from '../lib/map-assets';

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

const EASE = [0.22, 1, 0.36, 1] as const;

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
            transition={{ duration: 0.15 }}
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
            transition={{ duration: 0.22, ease: EASE }}
            className="relative w-full sm:max-w-[720px] max-h-[100dvh] sm:max-h-[min(860px,90vh)] bg-[#111113] rounded-t-2xl sm:rounded-xl border-t sm:border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
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
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 p-8">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-zinc-200" />
      <p className="text-sm text-zinc-400">Loading scoreboard…</p>
      <button
        type="button"
        onClick={onClose}
        className="text-xs text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
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
  const mapRaw = type === 'faceit' ? match.map : match.map_name;
  const mapName = getMapDisplayName(mapRaw);
  const mapIcon = getMapIcon(mapRaw);
  const banner = getMapBanner(mapRaw);
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
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-sm text-zinc-400">
          No scoreboard available for this match.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors duration-200 hover:text-white"
        >
          Close
        </button>
      </div>
    );
  }

  const [teamA, teamB] = [ordered[0], ordered[1]];

  return (
    <>
      {/* Header — map banner backdrop like the profile hero */}
      <header className="relative shrink-0 border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 blur-md saturate-125"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/maps/thumbs/unknown.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#111113]/80 to-[#111113]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={mapIcon}
                alt=""
                className="h-10 w-10 shrink-0 object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/maps/icons/unknown.svg';
                }}
              />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold tracking-tight text-white">
                  {mapName}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-400">
                  <img src={sourceLogo} alt="" className="inline h-3 w-3" />
                  <span className="capitalize">{sourceName}</span>
                  {when && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span>{when}</span>
                    </>
                  )}
                  {duration && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="tabular-nums">{duration}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 shrink-0 items-center rounded-lg border border-white/[0.08] bg-black/40 px-2.5 text-xs font-medium text-zinc-300 backdrop-blur-sm transition-colors duration-200 hover:text-white"
            >
              <HiX className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Final score */}
          <div className="flex items-center justify-center gap-4 px-4 pb-4 pt-3 sm:gap-6">
            <SideLabel team={teamA} align="right" />
            <div className="flex items-baseline gap-2 tabular-nums">
              <span
                className={`text-[40px] font-bold leading-none tracking-tight sm:text-[44px] ${
                  teamA?.won ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {teamA?.score ?? 0}
              </span>
              <span className="pb-1 text-2xl font-light text-zinc-600">:</span>
              <span
                className={`text-[40px] font-bold leading-none tracking-tight sm:text-[44px] ${
                  teamB?.won ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {teamB?.score ?? 0}
              </span>
            </div>
            <SideLabel team={teamB} align="left" />
          </div>
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
        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-white/[0.06] bg-[#14161a] px-4 py-3">
          {match.demo_url && (
            <FooterLink href={match.demo_url}>Download demo</FooterLink>
          )}
          {match.replay_url && (
            <FooterLink href={match.replay_url}>Replay</FooterLink>
          )}
          {match.matchUrl && (
            <FooterLink href={match.matchUrl}>FACEIT room</FooterLink>
          )}
        </footer>
      )}
    </>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-medium text-zinc-300 transition-colors duration-200 hover:border-white/20 hover:text-white"
    >
      {children}
      <HiOutlineExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

function SideLabel({
  team,
  align,
}: {
  team?: Team;
  align: 'left' | 'right';
}) {
  if (!team) return <div className="w-[4.5rem] sm:w-40" />;
  const color =
    team.side === 'ct'
      ? 'text-sky-300'
      : team.side === 't'
        ? 'text-amber-300'
        : 'text-zinc-300';

  const icon = sideIcon(team.side);
  // short form for the narrow mobile score strip; full name from sm up
  const short =
    team.side === 'ct' ? 'CT' : team.side === 't' ? 'T' : team.name;

  return (
    <div
      className={`w-[4.5rem] min-w-0 sm:w-40 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <div
        className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider ${color} ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {icon && <img src={icon} alt="" className="h-4 w-4 shrink-0" />}
        <span className="sm:hidden">{short}</span>
        <span className="hidden sm:inline">{team.name}</span>
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {team.won ? (
          <span className="text-emerald-400">Win</span>
        ) : (
          <span className="text-zinc-500">Loss</span>
        )}
      </div>
    </div>
  );
}

function sideIcon(side: 'ct' | 't' | 'neutral') {
  if (side === 'ct') return LOGOS.ct;
  if (side === 't') return LOGOS.t;
  return null;
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
      ? 'bg-sky-400'
      : team.side === 't'
        ? 'bg-amber-400'
        : 'bg-zinc-500';
  const headBg =
    team.side === 'ct'
      ? 'bg-sky-400/[0.06]'
      : team.side === 't'
        ? 'bg-amber-400/[0.06]'
        : 'bg-white/[0.02]';

  const maxK = Math.max(...team.players.map((p) => p.k), 0);

  return (
    <section className="border-b border-white/[0.05] last:border-0">
      <div
        className={`flex items-center justify-between px-3 py-1.5 sm:px-4 ${headBg}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-3.5 w-0.5 rounded-full ${accent}`} />
          {sideIcon(team.side) && (
            <img src={sideIcon(team.side)!} alt="" className="h-4 w-4 shrink-0" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            {team.name}
          </span>
        </div>
        <span
          className={`text-lg font-bold tabular-nums ${
            team.won ? 'text-white' : 'text-zinc-500'
          }`}
        >
          {team.score}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse">
          <thead>
            <tr className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="py-1.5 pl-3 pr-2 text-left font-medium sm:pl-4">
                Player
              </th>
              <th className="w-8 px-1.5 py-1.5 text-right font-medium">K</th>
              <th className="w-8 px-1.5 py-1.5 text-right font-medium">A</th>
              <th className="w-8 px-1.5 py-1.5 text-right font-medium">D</th>
              <th className="w-10 px-1.5 py-1.5 text-right font-medium">+/-</th>
              <th className="w-11 px-1.5 py-1.5 text-right font-medium">K/D</th>
              {!isFaceit && (
                <th className="w-10 px-1.5 py-1.5 text-right font-medium">ADR</th>
              )}
              <th className="w-10 px-1.5 py-1.5 text-right font-medium">HS%</th>
              {!isFaceit && (
                <th className="w-12 py-1.5 pl-1.5 pr-3 text-right font-medium sm:pr-4">
                  RTG
                </th>
              )}
              {isFaceit && (
                <th className="w-9 px-1.5 py-1.5 text-right font-medium">MVP</th>
              )}
              {isFaceit && (
                <th className="w-14 py-1.5 pl-1.5 pr-3 text-right font-medium sm:pr-4">
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
                  className={`border-t border-white/[0.04] last:border-0 ${
                    you ? 'bg-white/[0.045]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td
                    className={`py-2 pl-3 pr-2 sm:pl-4 ${
                      you ? 'shadow-[inset_2px_0_0_0_rgba(255,255,255,0.3)]' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-800 text-[10px] font-bold text-zinc-500 ${
                          you ? 'ring-1 ring-white/25' : ''
                        }`}
                      >
                        <span aria-hidden>{p.name.charAt(0).toUpperCase()}</span>
                        {av && (
                          <img
                            src={av}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      {p.steam64 ? (
                        <a
                          href={`/profile/${p.steam64}`}
                          className={`truncate text-[13px] hover:underline sm:max-w-[14rem] max-w-[9rem] ${
                            you
                              ? 'font-semibold text-white'
                              : 'font-medium text-zinc-200'
                          }`}
                        >
                          {p.name}
                        </a>
                      ) : (
                        <span
                          className={`max-w-[9rem] truncate text-[13px] sm:max-w-[14rem] ${
                            you
                              ? 'font-semibold text-white'
                              : 'font-medium text-zinc-200'
                          }`}
                        >
                          {p.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`px-1.5 py-2 text-right text-[13px] tabular-nums ${
                      top ? 'font-bold text-white' : 'font-medium text-zinc-100'
                    }`}
                  >
                    {p.k}
                  </td>
                  <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-400">
                    {p.a}
                  </td>
                  <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-400">
                    {p.d}
                  </td>
                  <td
                    className={`px-1.5 py-2 text-right text-[13px] font-medium tabular-nums ${
                      diff > 0
                        ? 'text-emerald-400'
                        : diff < 0
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-200">
                    {p.kd.toFixed(2)}
                  </td>
                  {!isFaceit && (
                    <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-200">
                      {p.adr != null ? Math.round(p.adr) : '—'}
                    </td>
                  )}
                  <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-200">
                    {p.hs != null ? `${Math.round(p.hs)}` : '—'}
                  </td>
                  {!isFaceit && (
                    <td
                      className={`py-2 pl-1.5 pr-3 text-right text-[13px] font-semibold tabular-nums sm:pr-4 ${
                        p.rating == null
                          ? 'text-zinc-500'
                          : p.rating >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                      }`}
                    >
                      {p.rating != null
                        ? `${p.rating >= 0 ? '+' : ''}${(p.rating * 100).toFixed(0)}`
                        : '—'}
                    </td>
                  )}
                  {isFaceit && (
                    <td className="px-1.5 py-2 text-right text-[13px] tabular-nums text-zinc-200">
                      {p.mvp ?? '—'}
                    </td>
                  )}
                  {isFaceit && (
                    <td className="py-2 pl-1.5 pr-3 text-right text-[11px] tabular-nums text-zinc-500 sm:pr-4">
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
          steam64: p.steam64,
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
    const won = team.won != null ? !!team.won : score > other;

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

    const side: Team['side'] =
      teamNum === 2 ? 'ct' : teamNum === 3 ? 't' : 'neutral';
    const name =
      side === 'ct'
        ? 'Counter-Terrorist'
        : side === 't'
          ? 'Terrorist'
          : idx === 0
            ? 'Team A'
            : 'Team B';

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
