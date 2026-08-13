import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { HiArrowSmLeft, HiHome } from 'react-icons/hi';
import { LOGOS } from '../lib/map-assets';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>404 · Vantage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] px-4 text-zinc-100 antialiased">
        {/* Blurred map backdrop */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maps/thumbs/de_dust2.png"
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-3xl saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/75 via-[#0a0a0b]/88 to-[#0a0a0b]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
        >
          {/* Brand */}
          <span className="mb-10 flex h-7 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGOS.brand} alt="Vantage" className="h-full w-auto object-contain" />
          </span>

          {/* Ghost map icon in a failed-scan frame */}
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
            <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-rose-400/60" />
            <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-rose-400/60" />
            <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-rose-400/60" />
            <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-rose-400/60" />
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-md bg-rose-400/[0.05]"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maps/icons/unknown.svg"
              alt=""
              className="h-12 w-12 object-contain opacity-40 grayscale drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            404<span className="text-rose-400">.</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            No target at this location. The page was moved or never existed.
          </p>

          {/* Status line */}
          <div className="mt-6 flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              status: not_found
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Actions */}
          <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition-colors duration-200 hover:border-white/20 hover:text-white active:bg-white/[0.07]"
            >
              <HiArrowSmLeft className="h-3.5 w-3.5" />
              Go back
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-xs font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 active:scale-[0.98]"
            >
              <HiHome className="h-3.5 w-3.5" />
              Search a player
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
