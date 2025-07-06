import { NextApiRequest, NextApiResponse } from 'next'
import { summarizeText } from '../../../lib/openai'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    videoId, 
    text, 
    maxLength = 500, 
    style = 'concise' 
  } = req.body

  // Either videoId or text must be provided
  if (!videoId && !text) {
    return res.status(400).json({ 
      error: 'Either videoId or text must be provided' 
    })
  }

  try {
    let contentToSummarize = text

    // If videoId is provided, get the video's subtitles
    if (videoId) {
      const video = await prisma.video.findUnique({
        where: { videoId },
        select: {
          subtitles: true,
          videoTitle: true,
          channelName: true,
        },
      })

      if (!video) {
        return res.status(404).json({ error: 'Video not found' })
      }

      if (!video.subtitles) {
        return res.status(404).json({ error: 'No subtitles available for this video' })
      }

      contentToSummarize = video.subtitles
    }

    if (!contentToSummarize || contentToSummarize.trim().length === 0) {
      return res.status(400).json({ error: 'No content to summarize' })
    }

    // Validate style parameter
    const validStyles = ['concise', 'detailed', 'bullet-points']
    if (!validStyles.includes(style)) {
      return res.status(400).json({ 
        error: 'Invalid style. Must be one of: concise, detailed, bullet-points' 
      })
    }

    // Validate maxLength
    const maxLengthNum = parseInt(maxLength)
    if (isNaN(maxLengthNum) || maxLengthNum < 50 || maxLengthNum > 2000) {
      return res.status(400).json({ 
        error: 'maxLength must be between 50 and 2000 characters' 
      })
    }

    // Generate summary
    const summary = await summarizeText({
      text: contentToSummarize,
      maxLength: maxLengthNum,
      style: style as 'concise' | 'detailed' | 'bullet-points',
    })

    res.status(200).json({
      summary: summary.summary,
      metadata: {
        originalLength: summary.originalLength,
        summaryLength: summary.summaryLength,
        compressionRatio: summary.compressionRatio,
        style,
        videoId: videoId || null,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Summarization error:', error)
    
    // Handle OpenAI specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      return res.status(500).json({
        error: 'AI service error',
        details: error.message || 'Failed to generate summary',
        type: error.type,
      })
    }

    res.status(500).json({ 
      error: 'Summarization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
