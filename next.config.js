/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  env: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig

