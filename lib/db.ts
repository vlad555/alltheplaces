import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database utility functions
export async function searchSubtitles(
  channelName: string,
  searchTerm: string,
  limit: number = 20
) {
  const videos = await prisma.video.findMany({
    where: {
      channelName: {
        equals: channelName,
        mode: 'insensitive',
      },
      subtitles: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    },
    orderBy: {
      uploadDate: 'desc',
    },
    take: limit,
  })

  // Extract subtitle fragments with context
  return videos.map(video => {
    const subtitles = video.subtitles || ''
    const searchIndex = subtitles.toLowerCase().indexOf(searchTerm.toLowerCase())
    
    if (searchIndex === -1) return { ...video, fragment: '' }
    
    // Get context around the search term (200 characters before and after)
    const contextStart = Math.max(0, searchIndex - 200)
    const contextEnd = Math.min(subtitles.length, searchIndex + searchTerm.length + 200)
    const fragment = subtitles.slice(contextStart, contextEnd)
    
    return {
      ...video,
      fragment: contextStart > 0 ? '...' + fragment : fragment,
    }
  })
}

export async function getChannelVideos(channelName: string) {
  return await prisma.video.findMany({
    where: {
      channelName: {
        equals: channelName,
        mode: 'insensitive',
      },
    },
    orderBy: {
      uploadDate: 'desc',
    },
  })
}

export async function getChannelStats(channelName: string) {
  const totalVideos = await prisma.video.count({
    where: {
      channelName: {
        equals: channelName,
        mode: 'insensitive',
      },
    },
  })

  const videosWithSubtitles = await prisma.video.count({
    where: {
      channelName: {
        equals: channelName,
        mode: 'insensitive',
      },
      subtitles: {
        not: null,
      },
    },
  })

  return {
    totalVideos,
    videosWithSubtitles,
    subtitleCoverage: totalVideos > 0 ? (videosWithSubtitles / totalVideos) * 100 : 0,
  }
}

