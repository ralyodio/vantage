import axios from 'axios';
import type { SteamProfile } from '@vantage/shared';
import { steamId64ToAccountId } from '@vantage/shared';
import { CS2Service } from './cs2';

const STEAM_API_BASE = 'https://api.steampowered.com';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function parseMiniBackground(bg: any): SteamProfile['profileBackground'] | undefined {
  if (!bg) return undefined;
  if (typeof bg === 'string' && bg.startsWith('http')) {
    return { image: bg };
  }
  if (typeof bg !== 'object') return undefined;

  const image = bg.image || bg.poster || undefined;
  const videoMp4 = bg['video/mp4'] || bg.mp4 || undefined;
  const videoWebm = bg['video/webm'] || bg.webm || undefined;
  if (!image && !videoMp4 && !videoWebm) return undefined;
  return { image, videoMp4, videoWebm };
}

/**
 * Full profile page background (has_profile_background / animated).
 * This is the actual profile wallpaper — different from miniprofile hover bg.
 */
function parseProfilePageBackground(html: string): SteamProfile['profileBackground'] | undefined {
  if (!html) return undefined;

  // Animated background video block
  const anim = html.match(
    /class="profile_animated_background"[\s\S]{0,1200}?<\/div>/i
  );
  if (anim) {
    const block = anim[0];
    const poster = block.match(/poster="([^"]+)"/i)?.[1];
    const webm = block.match(/src="([^"]+\.webm)"/i)?.[1];
    const mp4 = block.match(/src="([^"]+\.mp4)"/i)?.[1];
    if (poster || webm || mp4) {
      return {
        image: poster,
        videoWebm: webm,
        videoMp4: mp4,
      };
    }
  }

  // Static CSS background on .has_profile_background
  // style="background-image: url( 'https://...' );"
  const styleMatch =
    html.match(
      /has_profile_background[^>]*style="[^"]*background-image:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/i
    ) ||
    html.match(
      /background-image:\s*url\(\s*['"]?(https:\/\/[^'")\s]+\/(?:community_assets\/images\/items|steamcommunity\/public\/images\/items)\/[^'")\s]+)['"]?\s*\)/i
    );

  if (styleMatch?.[1]) {
    return { image: styleMatch[1].replace(/&amp;/g, '&') };
  }

  return undefined;
}

export class SteamService {
  private cs2Service = new CS2Service();

  /**
   * Public miniprofile JSON — avatar frame, mini bg, level class, favorite badge.
   * No API key. accountId = steamId64 - 76561197960265728
   */
  private async getMiniProfile(steamId64: string): Promise<{
    level?: number;
    levelClass?: string;
    avatarFrame?: string;
    miniBackground?: SteamProfile['profileBackground'];
    favoriteBadge?: SteamProfile['favoriteBadge'];
    avatar?: string;
  } | null> {
    const accountId = steamId64ToAccountId(steamId64);
    if (accountId == null) return null;
    try {
      const res = await axios.get(
        `https://steamcommunity.com/miniprofile/${accountId}/json`,
        {
          timeout: 8000,
          headers: BROWSER_HEADERS,
        }
      );
      const d = res.data;
      if (!d || typeof d !== 'object') return null;

      const badge = d.favorite_badge;
      const favoriteBadge =
        badge && badge.name
          ? {
              name: String(badge.name),
              xp: badge.xp != null ? String(badge.xp) : undefined,
              level: badge.level != null ? Number(badge.level) : undefined,
              description: badge.description ? String(badge.description) : undefined,
              icon: badge.icon ? String(badge.icon) : undefined,
            }
          : undefined;

      return {
        level: d.level != null ? Number(d.level) : undefined,
        levelClass: d.level_class ? String(d.level_class) : undefined,
        avatarFrame: d.avatar_frame ? String(d.avatar_frame) : undefined,
        miniBackground: parseMiniBackground(d.profile_background),
        favoriteBadge,
        avatar: d.avatar_url ? String(d.avatar_url) : undefined,
      };
    } catch (err) {
      console.warn(`Steam miniprofile fetch failed for ${steamId64}:`, err);
      return null;
    }
  }

  /** Scrape equipped full-page profile background from the public profile HTML. */
  private async getProfilePageBackground(
    steamId64: string,
    profileUrl?: string
  ): Promise<SteamProfile['profileBackground'] | undefined> {
    const urls = [
      profileUrl,
      `https://steamcommunity.com/profiles/${steamId64}/`,
    ].filter(Boolean) as string[];

    for (const url of urls) {
      try {
        const res = await axios.get(url, {
          timeout: 10000,
          headers: BROWSER_HEADERS,
          maxRedirects: 5,
          responseType: 'text',
          // Steam sometimes returns gzip; axios handles decompress by default
          validateStatus: (s) => s >= 200 && s < 400,
        });
        const html = typeof res.data === 'string' ? res.data : String(res.data ?? '');
        const bg = parseProfilePageBackground(html);
        if (bg) return bg;
      } catch (err) {
        console.warn(`Steam profile page scrape failed for ${url}:`, err);
      }
    }
    return undefined;
  }

  async getProfile(steamId64: string, apiKey?: string): Promise<SteamProfile> {
    const STEAM_API_KEY = apiKey || process.env.STEAM_API_KEY;
    if (!STEAM_API_KEY) {
      throw new Error('STEAM_API_KEY required. Please provide your Steam API key.');
    }
    
    // Fetch ALL available data in parallel
    const [summaryRes, bansRes, friendsRes, levelRes, ownedGamesRes, cs2StatsRes, mini, pageBg] =
      await Promise.all([
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, {
        params: { key: STEAM_API_KEY, steamids: steamId64 },
      }),
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerBans/v1/`, {
        params: { key: STEAM_API_KEY, steamids: steamId64 },
      }),
      axios.get(`${STEAM_API_BASE}/ISteamUser/GetFriendList/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, relationship: 'friend' },
      }).catch(() => null), // May fail if profile is private
      axios.get(`${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64 },
      }).catch(() => null),
      axios.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, include_appinfo: 1, include_played_free_games: 1 },
      }).catch(() => null),
      axios.get(`${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/`, {
        params: { key: STEAM_API_KEY, steamid: steamId64, appid: '730' },
      }).catch(() => null),
      this.getMiniProfile(steamId64),
      this.getProfilePageBackground(steamId64),
    ]);
    
    const player = summaryRes.data.response?.players?.[0];
    const bans = bansRes.data.players?.[0];
    
    if (!player) {
      throw new Error('Steam profile not found');
    }

    const accountId = steamId64ToAccountId(steamId64) ?? undefined;
    
    // Calculate account age
    const accountCreated = player.timecreated 
      ? new Date(player.timecreated * 1000) 
      : undefined;
    
    const yearsOfService = accountCreated
      ? Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 365))
      : undefined;
    
    // Friend count
    const friendCount = friendsRes?.data?.friendslist?.friends?.length || undefined;
    
    // Steam level (API + miniprofile fallback)
    const level =
      levelRes?.data?.response?.player_level ?? mini?.level ?? undefined;
    
    // Game count
    const gameCount = ownedGamesRes?.data?.response?.game_count || undefined;
    
    // Find CS2 game data
    const cs2Game = ownedGamesRes?.data?.response?.games?.find((g: any) => g.appid === 730);
    
    // Get CS2 achievements
    const achievementsRes = await axios.get(
      `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/`,
      {
        params: { key: STEAM_API_KEY, steamid: steamId64, appid: '730' },
      }
    ).catch(() => null);
    
    const achievements = achievementsRes?.data?.playerstats?.achievements;
    const achievementsUnlocked = achievements?.filter((a: any) => a.achieved === 1).length || undefined;
    const totalAchievements = achievements?.length || undefined;
    const achievementPercentage = totalAchievements && achievementsUnlocked
      ? Math.round((achievementsUnlocked / totalAchievements) * 100)
      : undefined;
    
    // Parse CS2 detailed stats
    let cs2DetailedStats: any = {};
    if (cs2StatsRes?.data?.playerstats?.stats) {
      const stats = cs2StatsRes.data.playerstats.stats;
      const findStat = (name: string) => {
        const stat = stats.find((s: any) => s.name === name);
        return stat ? stat.value : undefined;
      };
      
      const totalKills = findStat('total_kills');
      const totalDeaths = findStat('total_deaths');
      const totalHeadshots = findStat('total_kills_headshot');
      const totalWins = findStat('total_wins');
      const totalMatchesWon = findStat('total_matches_won');
      const totalRoundsPlayed = findStat('total_rounds_played');
      
      cs2DetailedStats = {
        totalKills,
        totalDeaths,
        kdRatio: totalKills && totalDeaths ? parseFloat((totalKills / totalDeaths).toFixed(2)) : undefined,
        totalWins: totalMatchesWon || totalWins,
        totalMatches: totalRoundsPlayed ? Math.floor(totalRoundsPlayed / 24) : undefined,
        winRate: totalRoundsPlayed && totalMatchesWon
          ? parseFloat((totalMatchesWon / (totalRoundsPlayed / 24)).toFixed(3))
          : undefined,
        totalRoundsPlayed,
        totalDamage: findStat('total_damage_done'),
        totalMoneyEarned: findStat('total_money_earned'),
        totalMVPs: findStat('total_mvps'),
        headshotPercentage: totalKills && totalHeadshots
          ? parseFloat(((totalHeadshots / totalKills) * 100).toFixed(1))
          : undefined,
      };
    }
    
    // Get basic CS2 game stats (hours played)
    const cs2Stats = await this.cs2Service.getCS2GameStats(steamId64);
    
    return {
      steamId64,
      accountId,
      username: player.personaname,
      realName: player.realname,
      avatar: player.avatarfull || mini?.avatar,
      profileUrl: player.profileurl,
      accountCreated,
      level,
      levelClass: mini?.levelClass,
      yearsOfService,
      isPrime: false, // Note: Prime status requires Game Coordinator access
      isPrivate: player.communityvisibilitystate !== 3,
      vacBanned: bans?.VACBanned || false,
      gameBanned: bans?.NumberOfGameBans > 0 || false,
      daysSinceLastBan: bans?.DaysSinceLastBan,
      communityBanned: bans?.CommunityBanned || false,
      country: player.loccountrycode,
      state: player.locstatecode,
      friendCount,
      gameCount,
      avatarFrame: mini?.avatarFrame,
      // Prefer full profile wallpaper; fall back to miniprofile hover background
      profileBackground: pageBg || mini?.miniBackground,
      favoriteBadge: mini?.favoriteBadge,
      cs2Stats: {
        hoursPlayed: cs2Game?.playtime_forever ? Math.floor(cs2Game.playtime_forever / 60) : cs2Stats?.hoursPlayed,
        hoursLast2Weeks: cs2Game?.playtime_2weeks ? Math.floor(cs2Game.playtime_2weeks / 60) : undefined,
        lastPlayed: cs2Stats?.lastPlayed,
        achievementsUnlocked,
        totalAchievements,
        achievementPercentage,
        ...cs2DetailedStats,
      },
    };
  }
}
