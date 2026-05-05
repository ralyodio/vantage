"use client";

import Image from 'next/image';
import { HiOutlineExternalLink } from 'react-icons/hi';
import type { UserProfile } from '@vantage/shared';
import {
  getSteamLevelColor,
  getSteamLevelGlow,
  getSteamLevelStyle,
  parseSteamLevelClass,
} from '@vantage/shared';
import {
  LOGOS,
  getFaceitLevelIcon,
  formatPct,
  formatNum,
} from '../lib/map-assets';

export default function ProfileCard({ profile }: { profile: UserProfile }) {
  const { steam, faceit, leetify } = profile;
  const banned = steam.vacBanned || steam.gameBanned || steam.communityBanned;
  const cs = steam.cs2Stats;
  const levelIcon = getFaceitLevelIcon(faceit?.level);

  const levelFromClass = parseSteamLevelClass(steam.levelClass);
  const levelForColor = steam.level ?? levelFromClass;
  const levelColor = getSteamLevelColor(levelForColor);
  const levelGlow = getSteamLevelGlow(levelForColor);
  const levelStyle = getSteamLevelStyle(levelForColor);

  const bg = steam.profileBackground;
  const hasBg =
    !!(bg?.image || bg?.videoMp4 || bg?.videoWebm);

  const kpis: { label: string; value: string; hint?: string; tone?: string }[] = [
    {
      label: 'Playtime',
      value: cs?.hoursPlayed != null ? `${cs.hoursPlayed.toLocaleString()}h` : '—',
      hint: cs?.hoursLast2Weeks != null ? `${cs.hoursLast2Weeks}h / 2wk` : undefined,
    },
    {
      label: 'Steam K/D',
      value: cs?.kdRatio != null ? formatNum(cs.kdRatio) : '—',
      hint: cs?.headshotPercentage != null ? `${cs.headshotPercentage}% HS` : undefined,
    },
    {
      label: 'FACEIT ELO',
      value: faceit ? String(faceit.elo) : '—',
      hint: faceit ? `Level ${faceit.level}` : undefined,
      tone: faceit ? 'text-[#FF5500]' : undefined,
    },
    {
      label: 'FACEIT K/D',
      value: faceit ? formatNum(faceit.avgKD) : '—',
      hint: faceit ? formatPct(faceit.winRate) + ' WR' : undefined,
    },
    {
      label: 'Leetify',
      value:
        leetify?.ranks?.leetify != null
          ? Number(leetify.ranks.leetify).toFixed(2)
          : '—',
      tone: leetify ? 'text-[#f84982]' : undefined,
      hint:
        leetify?.winrate != null ? formatPct(leetify.winrate) + ' WR' : undefined,
    },
    {
      label: 'Premier',
      value:
        leetify?.ranks?.premier != null ? String(leetify.ranks.premier) : '—',
      hint: 'via Leetify',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hero — Steam background + framed avatar + level ring */}
      <section className="relative rounded-xl border border-white/[0.08] bg-[#111113] overflow-hidden">
        {/* Equipped Steam profile wallpaper (full page bg preferred) */}
        {hasBg && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {bg?.videoMp4 || bg?.videoWebm ? (
              <video
                className="absolute inset-0 h-full w-full object-cover scale-105"
                autoPlay
                muted
                loop
                playsInline
                poster={bg.image}
              >
                {bg.videoWebm && <source src={bg.videoWebm} type="video/webm" />}
                {bg.videoMp4 && <source src={bg.videoMp4} type="video/mp4" />}
              </video>
            ) : bg?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bg.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-105"
              />
            ) : null}
            {/* Soft blur layer for depth without killing the wallpaper */}
            <div className="absolute inset-0 backdrop-blur-[2px] bg-black/25" />
            {/* Readability scrim — keep left darker for text, show art on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113]/90 via-transparent to-black/20" />
          </div>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5">
          {/*
            Avatar stack:
            - Square avatar (Steam profile style)
            - Equipped frame PNG when present
            - Level-colored border only when no frame
          */}
          <div className="relative shrink-0 w-[128px] h-[128px] sm:w-[148px] sm:h-[148px]">
            {steam.avatarFrame ? (
              <>
                <div className="absolute inset-[10%] rounded-md overflow-hidden bg-zinc-900">
                  {steam.avatar ? (
                    <Image
                      src={steam.avatar}
                      alt={steam.username}
                      fill
                      className="object-cover"
                      sizes="148px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={steam.avatarFrame}
                  alt=""
                  className="pointer-events-none absolute inset-0 w-full h-full object-contain z-10 drop-shadow-md"
                />
              </>
            ) : (
              <div
                className="absolute inset-0 rounded-lg p-[3px]"
                style={{
                  background: banned
                    ? 'linear-gradient(135deg, #ef4444, #991b1b)'
                    : `linear-gradient(135deg, ${levelColor}, ${levelColor}99)`,
                  boxShadow: banned
                    ? '0 0 14px rgba(239,68,68,0.4)'
                    : `0 0 14px ${levelGlow}`,
                }}
              >
                <div className="relative h-full w-full rounded-[6px] overflow-hidden bg-zinc-900">
                  {steam.avatar ? (
                    <Image
                      src={steam.avatar}
                      alt={steam.username}
                      fill
                      className="object-cover"
                      sizes="148px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate max-w-full drop-shadow">
                {steam.username}
              </h1>
              {banned && <Badge tone="red">Banned</Badge>}
              {steam.isPrivate && <Badge tone="amber">Private</Badge>}
              {steam.isPrime && <Badge tone="green">Prime</Badge>}
              {faceit?.hasBan && <Badge tone="red">FACEIT ban</Badge>}
            </div>

            <p className="text-sm text-zinc-300/90 flex flex-wrap gap-x-3 gap-y-1 drop-shadow">
              {steam.realName && (
                <span className="text-zinc-200">{steam.realName}</span>
              )}
              {steam.country && (
                <span>
                  {steam.country}
                  {steam.state ? ` · ${steam.state}` : ''}
                </span>
              )}
              <span>{steam.yearsOfService ?? 0} years on Steam</span>
              {steam.friendCount != null && <span>{steam.friendCount} friends</span>}
            </p>

            {(steam.favoriteBadge?.icon || steam.favoriteBadge?.name) && (
              <div className="group/badge relative inline-flex items-center gap-2 w-fit max-w-full">
                {steam.favoriteBadge.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={steam.favoriteBadge.icon}
                    alt=""
                    className="w-5 h-5 object-contain shrink-0"
                  />
                ) : null}
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {steam.favoriteBadge.name}
                </span>
                {steam.favoriteBadge.description && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 w-max max-w-[16rem] rounded-lg border border-white/10 bg-zinc-950/95 px-2.5 py-1.5 text-left shadow-xl backdrop-blur-sm opacity-0 translate-y-0.5 scale-[0.98] transition-all duration-200 ease-out group-hover/badge:opacity-100 group-hover/badge:translate-y-0 group-hover/badge:scale-100"
                  >
                    <div className="text-[10px] text-zinc-300 leading-snug">
                      {steam.favoriteBadge.description}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-0.5">
              <ExtLink
                href={steam.profileUrl}
                logo={LOGOS.steam}
                label="Steam"
                invertLogo
              />
              {faceit && (
                <ExtLink
                  href={`https://www.faceit.com/en/players/${faceit.nickname}`}
                  logo={LOGOS.faceit}
                  label="FACEIT"
                  color="#FF5500"
                />
              )}
              {leetify && (
                <ExtLink
                  href={`https://leetify.com/app/profile/${steam.steamId64}`}
                  logo={LOGOS.leetifyMark}
                  label="Leetify"
                  color="#f84982"
                />
              )}
            </div>
          </div>

          {/* Steam-style: "Level" + friendPlayerLevel circle — far right of hero */}
          {steam.level != null && (
            <div className="flex items-center gap-2.5 shrink-0 sm:ml-auto self-start sm:self-center">
              <span className="text-base sm:text-lg text-zinc-300 drop-shadow">Level</span>
              <SteamLevelBadge level={steam.level} style={levelStyle} />
            </div>
          )}
        </div>
      </section>

      {/* KPI strip — horizontal scroll on small screens */}
      <section
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin"
        aria-label="Key stats"
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            className="snap-start shrink-0 w-[42%] xs:w-[38%] sm:w-auto sm:flex-1 min-w-[7.5rem] rounded-xl border border-white/[0.08] bg-[#111113] px-3.5 py-3"
          >
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
              {k.label}
            </div>
            <div
              className={`text-xl sm:text-2xl font-semibold tabular-nums tracking-tight ${
                k.tone || 'text-white'
              }`}
            >
              {k.value}
            </div>
            {k.hint && (
              <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{k.hint}</div>
            )}
          </div>
        ))}
      </section>

      {/* Platform cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PlatformShell
          logo={LOGOS.faceit}
          title="FACEIT"
          titleClass="text-[#FF5500]"
          action={
            levelIcon ? (
              <img
                src={levelIcon}
                alt={faceit ? `Level ${faceit.level}` : 'Level'}
                className="w-9 h-9"
              />
            ) : null
          }
        >
          {faceit ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-semibold tabular-nums text-white">
                  {faceit.elo}
                </span>
                <span className="text-xs text-zinc-500">ELO</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Stat k="Level" v={String(faceit.level)} />
                <Stat k="K/D" v={formatNum(faceit.avgKD)} />
                <Stat k="Winrate" v={formatPct(faceit.winRate)} />
                <Stat k="Matches" v={String(faceit.matches)} />
                <Stat
                  k="HS%"
                  v={
                    faceit.avgHeadshotPercent != null
                      ? `${faceit.avgHeadshotPercent.toFixed(0)}%`
                      : '—'
                  }
                />
                <Stat k="Region" v={faceit.region || '—'} />
              </dl>
            </>
          ) : (
            <Empty>No FACEIT account linked</Empty>
          )}
        </PlatformShell>

        <PlatformShell
          title={
            <img
              src={LOGOS.leetify}
              alt="Leetify"
              className="h-3.5 w-auto max-w-[96px] object-contain object-left"
            />
          }
        >
          {leetify?.rating ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Score label="Aim" value={normRating(leetify.rating.aim)} />
                <Score label="Pos" value={normRating(leetify.rating.positioning)} />
                <Score label="Util" value={normRating(leetify.rating.utility)} />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Stat
                  k={
                    <span className="inline-flex items-center gap-1">
                      <img src={LOGOS.ct} alt="" className="w-3.5 h-3.5" />
                      CT
                    </span>
                  }
                  v={rel(leetify.rating.ct_leetify)}
                />
                <Stat
                  k={
                    <span className="inline-flex items-center gap-1">
                      <img src={LOGOS.t} alt="" className="w-3.5 h-3.5" />
                      T
                    </span>
                  }
                  v={rel(leetify.rating.t_leetify)}
                />
                <Stat k="Clutch" v={normRating(leetify.rating.clutch).toFixed(0)} />
                <Stat k="Opening" v={normRating(leetify.rating.opening).toFixed(0)} />
                <Stat k="Winrate" v={formatPct(leetify.winrate)} />
                <Stat k="Matches" v={String(leetify.total_matches ?? '—')} />
              </dl>
            </>
          ) : (
            <Empty>No public Leetify profile</Empty>
          )}
        </PlatformShell>

        <PlatformShell
          logo={LOGOS.cs2}
          logoClass="opacity-90 brightness-0 invert"
          title="CS2 Steam"
          titleClass="text-zinc-300"
        >
          {cs?.hoursPlayed != null && cs.hoursPlayed > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-semibold tabular-nums text-white">
                  {cs.hoursPlayed.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">hours</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Stat k="K/D" v={cs.kdRatio != null ? formatNum(cs.kdRatio) : '—'} />
                <Stat
                  k="HS%"
                  v={
                    cs.headshotPercentage != null
                      ? `${cs.headshotPercentage}%`
                      : '—'
                  }
                />
                <Stat k="Kills" v={cs.totalKills?.toLocaleString() ?? '—'} />
                <Stat k="Deaths" v={cs.totalDeaths?.toLocaleString() ?? '—'} />
                <Stat k="MVPs" v={cs.totalMVPs?.toLocaleString() ?? '—'} />
                <Stat
                  k="Achievements"
                  v={
                    cs.achievementPercentage != null
                      ? `${cs.achievementPercentage}%`
                      : '—'
                  }
                />
              </dl>
            </>
          ) : (
            <Empty>Stats private or unavailable</Empty>
          )}
        </PlatformShell>
      </section>
    </div>
  );
}

function normRating(v?: number) {
  if (v == null) return 0;
  return v > 0 && v <= 1 ? v * 100 : v;
}

function rel(v?: number) {
  if (v == null) return '—';
  const p = v * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
}

/** Official Steam friendPlayerLevel circle (border colors / 100+ sprites) */
function SteamLevelBadge({
  level,
  style,
}: {
  level: number;
  style: ReturnType<typeof getSteamLevelStyle>;
}) {
  // Scale: Steam base is 28/32px; we use ~1.6× for hero prominence
  if (style.isSpecial && style.backgroundImage) {
    const size = 48;
    // Sprites are 32px rows; scale the whole badge via transform
    return (
      <div
        className="relative inline-flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${style.backgroundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${size}px auto`,
          backgroundPosition: `0 ${(style.backgroundPositionY / 32) * size}px`,
          fontSize: 18,
          lineHeight: `${size}px`,
          textShadow: '1px 1px #1a1a1a',
          color: '#e5e5e5',
        }}
        title={`Steam level ${level}`}
      >
        <span className="font-semibold tabular-nums">{level}</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center select-none rounded-full border-[3px] font-semibold tabular-nums text-white"
      style={{
        width: 44,
        height: 44,
        lineHeight: '38px',
        fontSize: 18,
        borderColor: style.borderColor,
        boxShadow: `0 0 12px ${style.glow}`,
      }}
      title={`Steam level ${level}`}
    >
      {level}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'red' | 'amber' | 'green';
}) {
  const map = {
    red: 'text-red-400 bg-red-500/10 border-red-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function PlatformShell({
  logo,
  logoClass,
  title,
  titleClass,
  action,
  children,
}: {
  logo?: string;
  logoClass?: string;
  title: React.ReactNode;
  titleClass?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111113] p-4 flex flex-col min-h-[200px]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {logo && (
            <img src={logo} alt="" className={`w-5 h-5 shrink-0 ${logoClass || ''}`} />
          )}
          {typeof title === 'string' ? (
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                titleClass || 'text-zinc-400'
              }`}
            >
              {title}
            </span>
          ) : (
            title
          )}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Stat({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-white/[0.04] pb-1.5 last:border-0">
      <dt className="text-zinc-500 text-xs">{k}</dt>
      <dd className="text-zinc-100 text-xs font-medium tabular-nums">{v}</dd>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2 text-center">
      <div className="text-lg font-semibold tabular-nums text-white">
        {value.toFixed(0)}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-600 py-8 text-center leading-relaxed">{children}</p>
  );
}

function ExtLink({
  href,
  logo,
  label,
  color,
  invertLogo,
}: {
  href: string;
  logo: string;
  label: string;
  color?: string;
  /** Force logo white on dark UI (e.g. black Steam mark) */
  invertLogo?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white rounded-lg border border-white/[0.08] hover:border-white/20 bg-white/[0.02] px-2.5 py-1.5 transition-colors"
      style={color ? { borderColor: `${color}33` } : undefined}
    >
      <img
        src={logo}
        alt=""
        className={`w-3.5 h-3.5 ${invertLogo ? 'brightness-0 invert' : ''}`}
      />
      {label}
      <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-60" aria-hidden />
    </a>
  );
}
