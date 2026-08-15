/** @type {import('next').NextConfig} */
const path = require('path');
const { loadEnvConfig } = require('@next/env');

// Load monorepo root .env (API keys, BACKEND_API_URL, etc.)
loadEnvConfig(path.resolve(__dirname, '../..'));

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.steamstatic.com',
      'steamcdn-a.akamaihd.net',
      'cdn.akamai.steamstatic.com',
      'cdn.cloudflare.steamstatic.com',
      'community.akamai.steamstatic.com',
      'community.cloudflare.steamstatic.com',
      'community.fastly.steamstatic.com',
      'shared.fastly.steamstatic.com',
      'shared.akamai.steamstatic.com',
      'shared.cloudflare.steamstatic.com',
      'steamcommunity.com',
      'avatars.akamai.steamstatic.com',
      'avatars.cloudflare.steamstatic.com',
      'avatars.fastly.steamstatic.com',
    ],
  },
  transpilePackages: ['@vantage/shared'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
}

module.exports = nextConfig
