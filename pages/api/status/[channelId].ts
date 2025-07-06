import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { channelId } = req.query

  if (!channelId || typeof channelId !== 'string') {
    return res.status(400).json({ error: 'Channel ID is required' })
  }

  try {
    // Get channel processing status
    const channel = await prisma.channel.findUnique({
      where: { channelId },
      select: {
        channelName: true,
        isProcessing: true,
        lastProcessed: true,
        videoCount: true,
      },
    })

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    // Get video statistics for this channel
    const totalVideos = await prisma.video.count({
      where: { channelId },
    })

    const videosWithSubtitles = await prisma.video.count({
      where: { 
        channelId,
        subtitles: {
          not: null,
        },
      },
    })

    // Get recent videos
    const recentVideos = await prisma.video.findMany({
      where: { channelId },
      orderBy: { uploadDate: 'desc' },
      take: 5,
      select: {
        videoTitle: true,
        uploadDate: true,
        subtitles: true,
      },
    })

    const status = {
      channelId,
      channelName: channel.channelName,
      isProcessing: channel.isProcessing,
      lastProcessed: channel.lastProcessed,
      totalVideos,
      videosWithSubtitles,
      subtitleCoverage: totalVideos > 0 ? (videosWithSubtitles / totalVideos) * 100 : 0,
      recentVideos: recentVideos.map(video => ({
        title: video.videoTitle,
        uploadDate: video.uploadDate,
        hasSubtitles: !!video.subtitles,
      })),
      estimatedTotalVideos: channel.videoCount,
    }

    res.status(200).json(status)
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({ 
      error: 'Failed to get channel status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
