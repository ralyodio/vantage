import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';
import axios from 'axios';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiSearch, HiRefresh, HiOutlineCollection, HiX } from 'react-icons/hi';

import ProfileCard from '../../components/ProfileCard';
import RiskMeter from '../../components/RiskMeter';
import MatchHistory from '../../components/MatchHistory';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import CaptchaModal from '../../components/CaptchaModal';
import DetailedStats from '../../components/DetailedStats';
import type { UserProfile, ApiResponse } from '@vantage/shared';
import { LOGOS } from '../../lib/map-assets';

const ease = [0.22, 1, 0.36, 1] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [navQuery, setNavQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await axios.get<ApiResponse<UserProfile>>(`/api/profile/${id}`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 429) {
          setShowCaptcha(true);
          return { requiresCaptcha: true, success: false };
        }
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
  });

  const handleRefresh = async () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const response = await axios.post(
        `/api/profile/${id}/refresh`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) await refetch();
    } catch (err: any) {
      setRefreshError(err.response?.data?.error || 'Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshMatches = async () => {
    if (!id || isRefreshingMatches) return;
    setIsRefreshingMatches(true);
    setRefreshError(null);
    try {
      const response = await axios.post(
        `/api/profile/${id}/refresh-matches`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) await refetch();
    } catch (err: any) {
      setRefreshError(err.response?.data?.error || 'Failed to refresh matches');
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = navQuery.trim();
    if (!q) return;
    setNavQuery('');
    router.push(`/profile/${encodeURIComponent(q)}`);
  };

  if (showCaptcha) {
    return (
      <CaptchaModal
        isOpen={true}
        onClose={() => router.push('/')}
        onSubmit={() => {
          setShowCaptcha(false);
          refetch();
        }}
        isLoading={isLoading}
      />
    );
  }
  if (isLoading) return <LoadingScreen />;
  if (error || (data && !data.success && !(data as any).requiresCaptcha)) {
    return (
      <ErrorState title="Error" message="Profile not found or API error." onRetry={refetch} />
    );
  }
  if (!data?.data) return null;

  const profile = data.data;

  return (
    <>
      <Head>
        <title>{profile.steam.username} · Vantage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 antialiased">
        {/* Floating island navbar — full content width */}
        <div className="sticky top-0 z-40 pointer-events-none px-3 sm:px-4 pt-3 sm:pt-4">
          <header className="pointer-events-auto mx-auto max-w-6xl flex items-center gap-2 sm:gap-3 h-12 sm:h-14 rounded-2xl border border-white/[0.08] bg-[#111113]/92 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] px-2 sm:px-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="hidden sm:inline text-[11px] font-semibold tracking-[0.16em] uppercase text-zinc-400 hover:text-white px-1 transition-colors duration-200 shrink-0"
            >
              Vantage
            </button>

            <form
              onSubmit={handleNavSearch}
              role="search"
              className="flex-1 min-w-0 max-w-md mx-auto"
            >
              <div className="flex items-center gap-2 h-9 rounded-xl bg-black/45 ring-1 ring-white/10 pl-3 pr-2 transition-shadow duration-200 focus-within:ring-white/25">
                <HiSearch className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <input
                  type="text"
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  placeholder="Search another player…"
                  aria-label="Search another player"
                  spellCheck={false}
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </form>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRefreshMatches}
                disabled={isRefreshingMatches}
                title="Refresh match history"
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-[7.25rem] rounded-xl border border-white/[0.08] bg-white/[0.03] px-0 sm:px-3 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] hover:border-white/15 transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                <HiOutlineCollection
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isRefreshingMatches ? 'animate-pulse' : ''
                  }`}
                />
                <span className="hidden sm:inline w-[4.5rem] text-center">
                  {isRefreshingMatches ? 'Updating…' : 'Matches'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh full profile"
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-[7.75rem] rounded-xl bg-white text-zinc-900 px-0 sm:px-3 text-xs font-semibold hover:bg-zinc-100 active:scale-[0.98] transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none"
              >
                <HiRefresh
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline w-[5rem] text-center">
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </span>
              </button>
            </div>
          </header>
        </div>

        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-16 sm:pb-20">
          <AnimatePresence mode="wait">
            {refreshError && (
              <motion.div
                key="refresh-error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.28, ease }}
                className="overflow-hidden mb-4"
              >
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2.5">
                  <span className="flex-1 min-w-0 leading-relaxed">{refreshError}</span>
                  <button
                    type="button"
                    onClick={() => setRefreshError(null)}
                    className="shrink-0 p-0.5 rounded text-red-400/80 hover:text-red-200 transition-colors duration-150"
                    aria-label="Dismiss"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <ProfileCard profile={profile} />
          </motion.div>

          <motion.div
            className="mt-4 lg:hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease, delay: 0.05 }}
          >
            <RiskMeter risk={profile.risk} />
          </motion.div>

          <div className="mt-4 sm:mt-5 grid lg:grid-cols-12 gap-4 sm:gap-5">
            <motion.div
              className="lg:col-span-8 space-y-5 min-w-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.08 }}
            >
              <DetailedStats profile={profile} />
              <MatchHistory
                faceitMatches={profile.faceit?.matchHistory}
                leetifyStats={profile.leetify}
                onRefresh={handleRefreshMatches}
                focusSteam64={profile.steam.steamId64}
                focusNickname={
                  profile.faceit?.nickname || profile.steam.username
                }
                focusAvatar={profile.steam.avatar}
              />
            </motion.div>

            <motion.div
              className="hidden lg:block lg:col-span-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.12 }}
            >
              <div className="sticky top-24">
                <RiskMeter risk={profile.risk} />
              </div>
            </motion.div>
          </div>

          {profile.leetify && (
            <motion.footer
              className="mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-2 text-zinc-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <span className="text-[11px] uppercase tracking-wide">Data provided by</span>
              <a
                href={`https://leetify.com/app/profile/${profile.steam.steamId64}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                <img src={LOGOS.leetify} alt="Leetify" className="h-3.5 w-auto" />
              </a>
            </motion.footer>
          )}
        </main>
      </div>
    </>
  );
}
