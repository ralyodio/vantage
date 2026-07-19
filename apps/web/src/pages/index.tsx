import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import { HiSearch, HiShieldCheck, HiDocumentSearch } from 'react-icons/hi';

import SearchBar from '../components/SearchBar';
import AnimatedCounter from '../components/AnimatedCounter';
import CaptchaModal from '../components/CaptchaModal';
import { LOGOS } from '../lib/map-assets';
import { RISK_FLAG_CATEGORIES } from '@vantage/shared';

const ease = [0.22, 1, 0.36, 1] as const;

const RISK_SIGNALS = Object.keys(RISK_FLAG_CATEGORIES).length;
const MAPS_TRACKED = 13;

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

  const examples = ['aebu', 'mango', '76561198192472755'];

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
      desc: 'Steam, FACEIT and Leetify merged into one profile — ranks, cosmetics, ELO and aim mechanics in a single view.',
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
        <title>Vantage — CS2 Intelligence Platform</title>
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
              Vantage
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
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="text-center"
          >
            <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              CS2 Intelligence Platform
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              VANTAGE<span className="text-emerald-400">.</span>
            </h1>
            <p className="mt-3 text-lg italic text-zinc-400 sm:text-xl">
              See what they&apos;re hiding.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.08 }}
            className="mt-8 w-full max-w-2xl"
          >
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                Try
              </span>
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleSearch(ex)}
                  disabled={isSearching}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats strip — mirrors profile KPI design */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.16 }}
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
            transition={{ duration: 0.45, ease, delay: 0.24 }}
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
            transition={{ duration: 0.45, ease, delay: 0.32 }}
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
        <footer className="relative z-10 border-t border-white/[0.06] px-4 py-6">
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
