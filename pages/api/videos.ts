import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      page = '1',
      limit = '20',
      channelId,
      hasCaption,
      sortBy = 'publishingDate',
      sortOrder = 'desc',
      search,
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}

    if (channelId) {
      where.channelId = channelId
    }

    if (hasCaption !== undefined) {
      where.hasCaption = hasCaption === 'true'
    }

    if (search) {
      where.OR = [
        { videoTitle: { contains: search as string, mode: 'insensitive' } },
        { channelName: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    const validSortFields = ['publishingDate', 'uploadDate', 'videoTitle', 'channelName', 'viewCount', 'createdAt']
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'publishingDate'
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc'

    // Get videos with pagination
    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          videoId: true,
          videoTitle: true,
          videoUrl: true,
          channelName: true,
          channelId: true,
          publishingDate: true,
          uploadDate: true,
          hasCaption: true,
          captionFileName: true,
          captionLanguage: true,
          thumbnailUrl: true,
          duration: true,
          viewCount: true,
          processingStatus: true,
          lastCaptionCheck: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.video.count({ where }),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    res.status(200).json({
      videos,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        channelId: channelId || null,
        hasCaption: hasCaption || null,
        search: search || null,
        sortBy: sortField,
        sortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    res.status(500).json({ 
      error: 'Failed to fetch videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

