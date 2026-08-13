import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { HiArrowSmLeft, HiRefresh } from 'react-icons/hi';

const ease = [0.22, 1, 0.36, 1] as const;

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Lookup failed',
  message = 'The profile could not be loaded. It may not exist, or a data source is unreachable.',
  errorCode,
  showRetry = true,
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) onRetry();
    else router.reload();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] px-4 text-zinc-100 antialiased">
      {/* Blurred map backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/maps/thumbs/de_train.png"
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
        {/* Failed-scan frame */}
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

        {errorCode && (
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            status: {String(errorCode).toLowerCase()}
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
          <span className="text-rose-400">.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
          {message}
        </p>

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          {showRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-xs font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 active:scale-[0.98]"
            >
              <HiRefresh className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition-colors duration-200 hover:border-white/20 hover:text-white active:bg-white/[0.07]"
          >
            <HiArrowSmLeft className="h-3.5 w-3.5" />
            New search
          </button>
        </div>
      </motion.div>
    </div>
  );
}
