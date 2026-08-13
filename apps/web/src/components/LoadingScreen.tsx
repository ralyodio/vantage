import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LOGOS } from '../lib/map-assets';

const ease = [0.22, 1, 0.36, 1] as const;

const loadingSteps = [
  'Resolving Steam identity',
  'Fetching profile data',
  'Reading FACEIT history',
  'Gathering match statistics',
  'Calculating threat score',
  'Compiling intelligence',
];

export default function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] px-4 text-zinc-100 antialiased">
      {/* Blurred map backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/maps/thumbs/de_nuke.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl saturate-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/75 via-[#0a0a0b]/88 to-[#0a0a0b]" />
      </div>

      {/* Scanner sweep line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-400/[0.06] to-transparent"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center"
      >
        {/* Brand */}
        <span className="mb-10 flex h-7 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGOS.brand} alt="Vantage" className="h-full w-auto object-contain" />
        </span>

        {/* Scan target: map icon in a scanning frame */}
        <div className="relative mb-10 flex h-24 w-24 items-center justify-center">
          {/* corner brackets */}
          <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-emerald-400/70" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-emerald-400/70" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-emerald-400/70" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-emerald-400/70" />

          {/* scan line inside frame */}
          <motion.div
            aria-hidden
            className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
            animate={{ top: ['12%', '88%', '12%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* target map icon */}
          <motion.div
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maps/icons/de_nuke.png"
              alt=""
              className="h-12 w-12 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        </div>

        {/* Section label */}
        <div className="mb-3 flex items-center gap-3 self-stretch">
          <h2 className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
            Analyzing target
          </h2>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Steps list */}
        <ul className="w-full space-y-2">
          {loadingSteps.map((step, i) => {
            const active = i === currentStep;
            const done = i < currentStep;
            return (
              <motion.li
                key={step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease, delay: 0.05 * i }}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-200 ${
                  active
                    ? 'border-emerald-400/25 bg-emerald-400/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {done ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-3.5 w-3.5 text-emerald-400"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8.5 6.5 12 13 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  ) : active ? (
                    <motion.span
                      className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400/30 border-t-emerald-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                  )}
                </span>
                <span
                  className={`text-xs ${
                    active
                      ? 'font-medium text-zinc-100'
                      : done
                        ? 'text-zinc-400'
                        : 'text-zinc-600'
                  }`}
                >
                  {step}
                </span>
                {done && (
                  <span className="ml-auto text-[9px] font-medium uppercase tracking-wide text-emerald-400/60">
                    ok
                  </span>
                )}
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
