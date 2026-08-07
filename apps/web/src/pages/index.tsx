import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import { HiSearch, HiShieldCheck, HiDocumentSearch } from 'react-icons/hi';

import SearchBar from '../components/SearchBar';
import AnimatedCounter from '../components/AnimatedCounter';
import CaptchaModal from '../components/CaptchaModal';
import { LOGOS, getMapBanner, getMapIcon } from '../lib/map-assets';
import { RISK_FLAG_CATEGORIES } from '@vantage/shared';

const ease = [0.22, 1, 0.36, 1] as const;

const RISK_SIGNALS = Object.keys(RISK_FLAG_CATEGORIES).length;
const MAPS_TRACKED = 13;

const MAP_KEYS = [
  'de_mirage',
  'de_inferno',
  'de_dust2',
  'de_nuke',
  'de_ancient',
  'de_anubis',
  'de_vertigo',
  'de_train',
] as const;

/** floating map icons scattered around the hero */
/**
 * 3 icons per side, arc-shaped but with irregular spacing/heights so it
 * reads scattered rather than a rigid ( ). Left leans (, right leans ).
 * Plus 2 mobile-only accents at the screen edges.
 */
const FLOATING_MAPS = [
  // left side
  { map: 'de_mirage', pos: 'left-[12%] top-[-2%]', size: 'h-10 w-10', opacity: 'opacity-80', duration: 6, delay: 0, hide: 'hidden md:block' },
  { map: 'de_inferno', pos: 'left-[2%] top-[38%]', size: 'h-14 w-14', opacity: 'opacity-85', duration: 5.5, delay: 1.1, hide: 'hidden md:block' },
  { map: 'de_nuke', pos: 'left-[13%] top-[88%]', size: 'h-10 w-10', opacity: 'opacity-80', duration: 7, delay: 0.4, hide: 'hidden md:block' },
  // right side
  { map: 'de_dust2', pos: 'right-[14%] top-[6%]', size: 'h-10 w-10', opacity: 'opacity-80', duration: 6.5, delay: 0.6, hide: 'hidden md:block' },
  { map: 'de_ancient', pos: 'right-[2%] top-[50%]', size: 'h-14 w-14', opacity: 'opacity-85', duration: 6.2, delay: 1.6, hide: 'hidden md:block' },
  { map: 'de_anubis', pos: 'right-[12%] top-[96%]', size: 'h-10 w-10', opacity: 'opacity-80', duration: 7.2, delay: 0.9, hide: 'hidden md:block' },
  // mobile-only accents, slotted in the clear zone between the tilted bands
  { map: 'de_vertigo', pos: 'left-[3%] top-[40%]', size: 'h-9 w-9', opacity: 'opacity-70', duration: 6.8, delay: 0.2, hide: 'md:hidden' },
  { map: 'de_train', pos: 'right-[3%] top-[86%]', size: 'h-9 w-9', opacity: 'opacity-70', duration: 7.4, delay: 1.3, hide: 'md:hidden' },
] as const;

export default function Home() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [totalSearches, setTotalSearches] = useState<number | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [isSubmittingCaptcha, setIsSubmittingCaptcha] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');

  const fetchSearchCount = () => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.totalSearches) {
          setTotalSearches(parseInt(data.data.totalSearches));
        }
      })
      .catch(() => setTotalSearches(null));
  };

  useEffect(() => {
    fetchSearchCount();
    const interval = setInterval(fetchSearchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (query: string) => {
    setIsSearching(true);

    try {
      const response = await axios.get(`/api/profile/${encodeURIComponent(query)}`);

      if (response.data.success) {
        router.push(`/profile/${encodeURIComponent(query)}`);
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error: any) {
      if (error.response?.status === 429 && error.response.data?.requiresCaptcha) {
        setPendingQuery(query);
        setShowCaptcha(true);
        setIsSearching(false);
        return;
      }

      router.push(`/profile/${encodeURIComponent(query)}`);
    }

    setIsSearching(false);
  };

  const handleCaptchaSubmit = async (token: string) => {
    setIsSubmittingCaptcha(true);
    setCaptchaError('');

    try {
      const response = await axios.get(
        `/api/profile/${encodeURIComponent(pendingQuery)}?recaptcha_token=${encodeURIComponent(token)}`
      );

      if (response.data.success) {
        setShowCaptcha(false);
        setPendingQuery('');
        router.push(`/profile/${encodeURIComponent(pendingQuery)}`);
      } else {
        setCaptchaError(response.data.error || 'reCAPTCHA verification failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'reCAPTCHA verification failed';
      setCaptchaError(errorMessage);
    } finally {
      setIsSubmittingCaptcha(false);
    }
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
    setCaptchaError('');
    setPendingQuery('');
  };

  // every accepted query format, all resolving to the same (aebu) profile
  const examples: { label: string; query: string; kind: string }[] = [
    { label: 'aebu', query: 'aebu', kind: 'vanity' },
    {
      label: 'steamcommunity.com/id/aebu',
      query: 'https://steamcommunity.com/id/aebu/',
      kind: 'profile url',
    },
    { label: '76561199548276875', query: '76561199548276875', kind: 'steam64' },
    { label: 'STEAM_0:1:79400573', query: 'STEAM_0:1:79400573', kind: 'steam32' },
  ];

  const stats = [
    {
      label: 'Profiles analyzed',
      live: true,
    },
    { label: 'Data sources', value: '3' },
    { label: 'Risk signals', value: String(RISK_SIGNALS) },
    { label: 'Maps tracked', value: String(MAPS_TRACKED) },
  ];

  const features = [
    {
      kicker: 'Aggregation',
      title: 'Unified Intel',
      desc: 'Steam, FACEIT and Leetify merged into a single profile with ranks, cosmetics, ELO and aim mechanics.',
      logoRow: true,
      banner: '/maps/thumbs/de_mirage.png',
    },
    {
      kicker: 'Anti-cheat',
      title: 'Threat Assessment',
      desc: `${RISK_SIGNALS}-signal scoring engine flags smurfs, ban evaders and mechanical outliers before you queue against them.`,
      icon: HiShieldCheck,
      banner: '/maps/thumbs/de_nuke.png',
    },
    {
      kicker: 'Forensics',
      title: 'Match History',
      desc: 'Map-by-map history with full 10-player scoreboards, demo links and per-source filtering across every queue.',
      icon: HiDocumentSearch,
      banner: '/maps/thumbs/de_dust2.png',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Search',
      desc: 'Paste any Steam ID, vanity or profile link.',
    },
    {
      n: '02',
      title: 'Analyze',
      desc: 'Steam, FACEIT and Leetify data merged in seconds.',
    },
    {
      n: '03',
      title: 'Verdict',
      desc: 'Threat score, deep stats and full scoreboards.',
    },
  ];

  return (
    <>
      <Head>
        <title>Vantage · CS2 Intelligence Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="relative flex min-h-screen flex-col bg-[#0a0a0b] text-zinc-100 antialiased">
        {/* Blurred map backdrop — ties into profile hero */}
        <div className="pointer-events-none fixed inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maps/thumbs/de_mirage.png"
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/75 via-[#0a0a0b]/88 to-[#0a0a0b]" />
        </div>

        {/* Island navbar — mirrors profile page */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4"
        >
          <header className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#111113]/92 px-3 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:h-14 sm:px-4">
            <span className="flex h-5 items-center sm:h-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGOS.brand}
                alt="Vantage"
                className="h-full w-auto object-contain"
                draggable={false}
              />
            </span>
            <div className="flex items-center gap-2 rounded-lg bg-black/45 px-2.5 py-1.5 ring-1 ring-white/10">
              <HiSearch className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-sm font-semibold tabular-nums text-zinc-100">
                {totalSearches !== null ? (
                  <AnimatedCounter value={totalSearches} duration={1.2} />
                ) : (
                  '—'
                )}
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-zinc-500 xs:inline">
                analyzed
              </span>
            </div>
          </header>
        </motion.div>

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-3 pb-16 pt-14 sm:px-4 sm:pt-20">
          {/* Hero: rotated marquee bands + floating icons.
              Mobile: fixed-height windows with vertical fades so the rotated
              oversized layers never show clipped corners. Desktop: same
              angled counter-scrolling pair as before. */}
          <div className="relative w-full min-h-[30rem] overflow-hidden text-center sm:min-h-0 sm:overflow-visible">
            {/* mobile-only: upper tilted window (drifts left, faint) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[11rem] overflow-hidden opacity-[0.14] sm:hidden [mask-image:linear-gradient(180deg,transparent,black_30%,black_70%,transparent)]"
            >
              <div className="absolute left-1/2 top-1/2 w-[220%] -translate-x-1/2 -translate-y-1/2 rotate-[4deg] overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
                <motion.div
                  className="flex w-max gap-2 py-3"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
                >
                  {[...MAP_KEYS, ...MAP_KEYS].map((m, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`mt-${m}-${i}`}
                      src={getMapBanner(m)}
                      alt=""
                      className="h-24 w-44 shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* mobile-only: lower tilted window (drifts right, stronger) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[19rem] h-[11rem] overflow-hidden opacity-[0.20] sm:hidden [mask-image:linear-gradient(180deg,transparent,black_30%,black_70%,transparent)]"
            >
              <div className="absolute left-1/2 top-1/2 w-[220%] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
                <motion.div
                  className="flex w-max gap-2 py-3"
                  animate={{ x: ['-50%', '0%'] }}
                  transition={{ duration: 105, ease: 'linear', repeat: Infinity }}
                >
                  {[...MAP_KEYS].reverse().concat([...MAP_KEYS].reverse()).map((m, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`mb-${m}-${i}`}
                      src={getMapBanner(m)}
                      alt=""
                      className="h-24 w-44 shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* desktop-only: back strip, higher band, slower drift right, gentle tilt */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[150%] w-[max(130vw,100rem)] -translate-x-1/2 -translate-y-[38%] rotate-[5deg] overflow-hidden opacity-[0.16] sm:block [mask-image:linear-gradient(90deg,transparent,black_25%,black_75%,transparent)]"
            >
              <motion.div
                className="flex w-max gap-3 py-2"
                animate={{ x: ['-50%', '0%'] }}
                transition={{ duration: 160, ease: 'linear', repeat: Infinity }}
              >
                {[...MAP_KEYS].reverse().concat([...MAP_KEYS].reverse()).map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`b-${m}-${i}`}
                    src={getMapBanner(m)}
                    alt=""
                    className="h-40 w-72 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </motion.div>
            </div>

            {/* desktop-only: front strip, lower band, faster drift left, gentle tilt */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[150%] w-[max(120vw,92rem)] -translate-x-1/2 -translate-y-[6%] rotate-[-4deg] overflow-hidden opacity-[0.22] sm:block [mask-image:linear-gradient(90deg,transparent,black_22%,black_78%,transparent)]"
            >
              <motion.div
                className="flex w-max gap-3 py-2"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 110, ease: 'linear', repeat: Infinity }}
              >
                {[...MAP_KEYS, ...MAP_KEYS].map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`f-${m}-${i}`}
                    src={getMapBanner(m)}
                    alt=""
                    className="h-40 w-72 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </motion.div>
            </div>

            {/* floating map icons */}
            {FLOATING_MAPS.map((f) => (
              <motion.div
                key={f.map}
                aria-hidden
                className={`pointer-events-none absolute z-[5] ${f.pos} ${f.size} ${f.opacity} ${f.hide}`}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: f.duration,
                  delay: f.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMapIcon(f.map)}
                  alt=""
                  className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.65)]"
                />
              </motion.div>
            ))}

            <h1 className="relative z-10 font-bold tracking-tight text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.65)]">
              <span className="block overflow-hidden pb-2">
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.55, ease, delay: 0.1 }}
                  className="block text-4xl sm:text-5xl md:text-6xl"
                >
                  See what they&apos;re hiding.
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease, delay: 0.28 }}
              className="relative z-10 mt-4 text-sm text-zinc-400 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-base"
            >
              Threat scores, premier ranks and match forensics for any CS2
              player.
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.4 }}
            className="mt-10 w-full max-w-2xl"
          >
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                Try
              </span>
              {examples.map((ex) => (
                <button
                  key={ex.kind}
                  type="button"
                  onClick={() => handleSearch(ex.query)}
                  disabled={isSearching}
                  title={`${ex.kind}: ${ex.query}`}
                  className="group/chip inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  {ex.label}
                  <span className="rounded bg-black/40 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-zinc-500 opacity-70 transition-opacity duration-200 group-hover/chip:opacity-100">
                    {ex.kind}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats strip — mirrors profile KPI design */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.5 }}
            className="mt-12 w-full max-w-3xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]"
          >
            <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex min-h-[4.5rem] flex-col justify-center bg-[#111113] px-4 py-3"
                >
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {s.label}
                  </div>
                  <div className="text-xl font-semibold tabular-nums tracking-tight text-zinc-50">
                    {s.live ? (
                      totalSearches !== null ? (
                        <AnimatedCounter value={totalSearches} duration={1.6} />
                      ) : (
                        '—'
                      )
                    ) : (
                      s.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features — map-backed cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.6 }}
            className="mt-12 grid w-full grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] transition-colors duration-200 hover:border-white/[0.16]"
              >
                <div className="absolute inset-0" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.banner}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-20 transition-opacity duration-300 group-hover:opacity-30 blur-md saturate-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#111113]/60 via-[#111113]/85 to-[#111113]" />
                </div>
                <div className="relative z-10 p-5">
                  {f.logoRow ? (
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={LOGOS.steam}
                        alt=""
                        className="h-5 w-5 brightness-0 invert"
                      />
                      <img src={LOGOS.faceit} alt="" className="h-5 w-5" />
                      <img src={LOGOS.leetifyMark} alt="" className="h-5 w-5" />
                    </div>
                  ) : (
                    f.icon ? (
                      <f.icon className="mb-3 h-5 w-5 text-zinc-300" />
                    ) : null
                  )}
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    {f.kicker}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease, delay: 0.7 }}
            className="mt-12 w-full max-w-3xl"
          >
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                How it works
              </h2>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="text-[11px] font-semibold tabular-nums text-zinc-600">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">
                      {s.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.06] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-600">
              <span>Data provided by</span>
              <a
                href="https://leetify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 transition-opacity duration-200 hover:opacity-100"
              >
                <img src={LOGOS.leetify} alt="Leetify" className="h-3 w-auto" />
              </a>
            </div>
            <p className="text-[10px] text-zinc-700">
              Not affiliated with Valve Corporation or FACEIT.
            </p>
          </div>
        </footer>
      </div>

      <CaptchaModal
        isOpen={showCaptcha}
        onSubmit={handleCaptchaSubmit}
        onClose={handleCaptchaClose}
        isLoading={isSubmittingCaptcha}
        error={captchaError}
      />
    </>
  );
}
