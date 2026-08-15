"use client";

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeetifyMatchCard, LeetifyRecentMatchCard, FaceitMatchCard } from './MatchCards';
import MatchModal from './MatchModal';
import type { MatchStats, LeetifyStats } from '@vantage/shared';
import { LOGOS } from '../lib/map-assets';

const listEase = [0.22, 1, 0.36, 1] as const;
const PAGE_SIZE = 12;

interface MatchHistoryProps {
  faceitMatches?: MatchStats[];
  leetifyStats?: LeetifyStats;
  onRefresh?: () => void;
  focusSteam64?: string;
  focusNickname?: string;
  focusAvatar?: string;
}

type Source = 'all' | 'faceit' | 'leetify';

export default function MatchHistory({
  faceitMatches,
  leetifyStats,
  onRefresh,
  focusSteam64,
  focusNickname,
  focusAvatar,
}: MatchHistoryProps) {
  const [source, setSource] = useState<Source>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalData, setModalData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFullMatchDetails = async (match: any, type: 'leetify' | 'faceit') => {
    if (type === 'faceit') {
      setModalData({ match, type, loading: false });
      return;
    }

    // Already have a full scoreboard
    if (Array.isArray(match.stats) && match.stats.length >= 2) {
      setModalData({ match, type, loading: false });
      return;
    }

    setModalData({ match: null, type, loading: true });
    try {
      const dataSource = match.data_source || match.matchmaking_source || 'matchmaking';
      const dataSourceId =
        match.data_source_match_id ||
        match.game_id ||
        match.id;

      if (!dataSourceId) {
        setModalData({ match, type, loading: false });
        return;
      }

      const response = await fetch(
        `/api/matches/${encodeURIComponent(dataSource)}/${encodeURIComponent(String(dataSourceId))}`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setModalData({ match: result.data, type, loading: false });
          return;
        }
      }
      setModalData({ match, type, loading: false });
    } catch {
      setModalData({ match, type, loading: false });
    }
  };

  const hasFaceit = (faceitMatches?.length ?? 0) > 0;
  const hasLeetify = !!(
    leetifyStats?.match_history?.length || leetifyStats?.recent_matches?.length
  );

  const activeSource: Source =
    source === 'faceit' && !hasFaceit
      ? 'all'
      : source === 'leetify' && !hasLeetify
        ? 'all'
        : source;

  // Reset visible window when filter or data changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpandedId(null);
  }, [activeSource, faceitMatches, leetifyStats]);

  const allMatches = useMemo(() => {
    const list: any[] = [];
    if (leetifyStats?.match_history?.length) {
      list.push(
        ...leetifyStats.match_history.map((m) => ({
          type: 'leetify' as const,
          data: m,
          date: new Date(m.finished_at).getTime(),
          id: m.id || m.data_source_match_id || String(m.finished_at),
        }))
      );
    } else if (leetifyStats?.recent_matches?.length) {
      list.push(
        ...leetifyStats.recent_matches.map((m) => ({
          type: 'leetify-recent' as const,
          data: m,
          date: new Date(m.finished_at).getTime(),
          id: m.id || String(m.finished_at),
        }))
      );
    }
    if (faceitMatches?.length) {
      list.push(
        ...faceitMatches.map((m) => ({
          type: 'faceit' as const,
          data: m,
          date: new Date(m.date).getTime(),
          id: m.matchId,
        }))
      );
    }
    return list
      .filter((m) => activeSource === 'all' || m.type.startsWith(activeSource))
      .sort((a, b) => b.date - a.date);
  }, [activeSource, faceitMatches, leetifyStats]);

  const visibleMatches = allMatches.slice(0, visibleCount);
  const hasMore = visibleCount < allMatches.length;
  const remaining = Math.max(0, allMatches.length - visibleCount);

  const filters = useMemo(() => {
    if (!hasFaceit || !hasLeetify) return [];
    return [
      { id: 'all' as Source, label: 'All', logo: null as string | null },
      { id: 'faceit' as Source, label: 'FACEIT', logo: LOGOS.faceit },
      { id: 'leetify' as Source, label: 'Leetify', logo: LOGOS.leetifyMark },
    ];
  }, [hasFaceit, hasLeetify]);

  if (!hasFaceit && !hasLeetify) return null;

  const steamId = focusSteam64 || leetifyStats?.steam64_id || '';

  return (
    <>
      <MatchModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        match={modalData?.match}
        type={modalData?.type}
        loading={modalData?.loading}
        focusPlayer={{
          steam64: steamId,
          nickname: focusNickname,
          avatar: focusAvatar,
        }}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-3 min-w-0 sm:w-auto">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 shrink-0">
              Matches
            </h2>
            <div className="flex-1 h-px bg-white/[0.06] hidden sm:block" />
            <span className="text-xs text-zinc-600 tabular-nums shrink-0">
              {visibleMatches.length}
              {allMatches.length !== visibleMatches.length
                ? ` / ${allMatches.length}`
                : ''}
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  await onRefresh();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-50 shrink-0 -m-1 px-2 py-2 transition-colors duration-200"
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
          </div>

          {filters.length > 0 && (
            <div
              className="grid w-full grid-cols-3 rounded-xl border border-white/[0.08] p-1 bg-[#111113] sm:flex sm:w-auto"
              role="tablist"
            >
              {filters.map((s) => {
                const active = activeSource === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSource(s.id)}
                    className={`relative flex w-full items-center justify-center gap-1.5 px-2 py-2 sm:w-auto sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                      active
                        ? 'text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="match-source-pill"
                        className="absolute inset-0 rounded-lg bg-white shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      {s.logo && (
                        <img
                          src={s.logo}
                          alt=""
                          className={`w-3.5 h-3.5 shrink-0 transition-opacity duration-200 ${
                            active ? '' : 'opacity-80'
                          }`}
                        />
                      )}
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2 min-h-[4rem]">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleMatches.map((item) => (
              <motion.div
                key={`${activeSource}-${item.id}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
                transition={{ duration: 0.28, ease: listEase }}
              >
                {item.type === 'leetify' ? (
                  <LeetifyMatchCard
                    match={item.data}
                    steamId={steamId}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    onViewScoreboard={() =>
                      fetchFullMatchDetails(item.data, 'leetify')
                    }
                  />
                ) : item.type === 'leetify-recent' ? (
                  <LeetifyRecentMatchCard match={item.data} />
                ) : (
                  <FaceitMatchCard
                    match={item.data}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    onViewScoreboard={() =>
                      fetchFullMatchDetails(item.data, 'faceit')
                    }
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="inline-flex items-center justify-center gap-2 min-w-[10rem] h-10 rounded-xl border border-white/[0.1] bg-[#111113] px-5 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
            >
              Load more
              <span className="tabular-nums text-zinc-500">
                ({remaining} left)
              </span>
            </button>
          </div>
        )}
      </section>
    </>
  );
}
