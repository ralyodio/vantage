"use client";

import type { RiskAssessment } from '@vantage/shared';
import { getFlagCategory } from '@vantage/shared';

const LABELS: Record<string, string> = {
  ACCOUNT: 'Account',
  STATISTICS: 'Mechanics',
  PERFORMANCE: 'Performance',
  BEHAVIORAL: 'Behavioral',
};

const LEVEL_META = {
  low: {
    label: 'Low risk',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  medium: {
    label: 'Moderate risk',
    bar: 'bg-amber-400',
    text: 'text-amber-400',
  },
  high: {
    label: 'High risk',
    bar: 'bg-orange-500',
    text: 'text-orange-400',
  },
  critical: {
    label: 'Critical',
    bar: 'bg-red-500',
    text: 'text-red-400',
  },
} as const;

function formatFlagName(flag: string) {
  return flag
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RiskMeter({
  risk,
  compact,
}: {
  risk: RiskAssessment;
  compact?: boolean;
}) {
  const meta = LEVEL_META[risk.level] || LEVEL_META.medium;

  const grouped: Record<string, typeof risk.flags> = {
    ACCOUNT: [],
    STATISTICS: [],
    PERFORMANCE: [],
    BEHAVIORAL: [],
  };

  risk.flags.forEach((flag) => {
    const cat = getFlagCategory(flag.flag);
    grouped[cat].push(flag);
  });

  if (compact) {
    return (
      <section className="rounded-xl border border-white/[0.08] bg-[#111113] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 mb-1">
              Threat assessment
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-semibold tabular-nums ${meta.text}`}>
                {risk.totalScore}
              </span>
              <span className="text-zinc-600 text-sm">/100</span>
            </div>
            <div className={`text-xs font-medium mt-0.5 ${meta.text}`}>{meta.label}</div>
          </div>
          <div className="flex-1 max-w-[10rem]">
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${meta.bar}`}
                style={{ width: `${Math.min(risk.totalScore, 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 mt-1.5 text-right">
              {risk.flags.length} signal{risk.flags.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <aside className="rounded-xl border border-white/[0.08] bg-[#111113] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Threat assessment
        </h2>
        <span className={`text-[11px] font-semibold ${meta.text}`}>{meta.label}</span>
      </div>

      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-semibold tabular-nums leading-none ${meta.text}`}>
              {risk.totalScore}
            </span>
            <span className="text-zinc-600 text-sm">/100</span>
          </div>
          <span className="text-xs text-zinc-500">
            {risk.flags.length} signal{risk.flags.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${meta.bar}`}
            style={{ width: `${Math.min(risk.totalScore, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600 tabular-nums">
          <span>0</span>
          <span>26</span>
          <span>48</span>
          <span>72</span>
          <span>100</span>
        </div>
      </div>

      <div className="max-h-[min(28rem,calc(100vh-14rem))] overflow-y-auto overscroll-contain">
        {risk.flags.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500 leading-relaxed">
            No elevated risk signals on the available data.
          </p>
        ) : (
          Object.entries(grouped).map(([cat, flags]) => {
            if (!flags.length) return null;
            const sum = flags.reduce((s, f) => s + f.weight, 0);
            return (
              <div key={cat} className="border-b border-white/[0.06] last:border-0">
                <div className="px-4 py-2 flex justify-between bg-white/[0.02]">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    {LABELS[cat] || cat}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-zinc-500">
                    +{sum}
                  </span>
                </div>
                <ul>
                  {flags.map((f, i) => (
                    <li
                      key={`${f.flag}-${i}`}
                      className="px-4 py-3 border-t border-white/[0.04] flex gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-zinc-200">
                          {formatFlagName(f.flag)}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
                          {f.reason}
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-zinc-400 shrink-0">
                        +{f.weight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
