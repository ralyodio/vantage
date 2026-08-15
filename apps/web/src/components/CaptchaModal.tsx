import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiShieldCheck } from 'react-icons/hi';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface CaptchaModalProps {
  isOpen: boolean;
  onSubmit: (token: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function CaptchaModal({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
  error
}: CaptchaModalProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isOpen) return;

    // In development, skip reCAPTCHA and show test button
    if (isDevelopment) {
      console.log('ℹ️  reCAPTCHA disabled in development mode');
      return;
    }

    // Load reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderRecaptcha();
      };
    } else {
      renderRecaptcha();
    }

    return () => {
      // Cleanup widget when modal closes
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // Widget might not exist anymore
        }
      }
    };
  }, [isOpen, isDevelopment]);

  const renderRecaptcha = () => {
    if (!recaptchaRef.current || !window.grecaptcha?.render || !siteKey) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onSubmit(token);
        },
        'error-callback': () => {
          console.error('reCAPTCHA error');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
      });
    } catch (e) {
      console.error('Failed to render reCAPTCHA:', e);
    }
  };

  const handleDevBypass = () => {
    // In development, bypass with a test token
    onSubmit('dev-bypass-token');
  };

  const handleClose = () => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (e) {
        // Ignore
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 flex items-center justify-center z-[101]"
          >
            <div className="rounded-2xl border border-white/[0.08] bg-[#111113]/95 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-md w-full mx-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <HiShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">
                    Verification required
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
                  aria-label="Close"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 text-center leading-relaxed">
                  {isDevelopment
                    ? 'reCAPTCHA is disabled in development mode.'
                    : "You've reached the rate limit. Verify you're human to continue."}
                </p>

                {/* reCAPTCHA Container */}
                {isDevelopment ? (
                  <div className="flex justify-center">
                    <button
                      onClick={handleDevBypass}
                      disabled={isLoading}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-5 text-xs font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-40"
                    >
                      {isLoading ? 'Verifying…' : 'Continue (dev mode)'}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div ref={recaptchaRef} />
                  </div>
                )}

                {error && (
                  <p className="text-xs text-rose-400 text-center">
                    {error}
                  </p>
                )}

                {isLoading && (
                  <div className="text-center text-xs text-zinc-500">
                    Verifying…
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-zinc-300 transition-colors duration-200 hover:border-white/20 hover:text-white disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}