import { NextApiRequest, NextApiResponse } from 'next'
import { answerQuestion } from '../../../lib/openai'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    question, 
    videoId, 
    context, 
    channelName,
    maxTokens = 500 
  } = req.body

  if (!question) {
    return res.status(400).json({ error: 'Question is required' })
  }

  try {
    let contextText = context

    // If videoId is provided, use that video's subtitles as context
    if (videoId) {
      const video = await prisma.video.findUnique({
        where: { videoId },
        select: {
          subtitles: true,
          videoTitle: true,
          channelName: true,
          videoUrl: true,
        },
      })

      if (!video) {
        return res.status(404).json({ error: 'Video not found' })
      }

      if (!video.subtitles) {
        return res.status(404).json({ error: 'No subtitles available for this video' })
      }

      contextText = `Video: ${video.videoTitle}\nChannel: ${video.channelName}\n\nTranscript:\n${video.subtitles}`
    }
    // If channelName is provided, use recent videos from that channel as context
    else if (channelName) {
      const recentVideos = await prisma.video.findMany({
        where: {
          channelName: {
            equals: channelName,
            mode: 'insensitive',
          },
          subtitles: {
            not: null,
          },
        },
        orderBy: {
          uploadDate: 'desc',
        },
        take: 5,
        select: {
          videoTitle: true,
          subtitles: true,
          uploadDate: true,
        },
      })

      if (recentVideos.length === 0) {
        return res.status(404).json({ 
          error: 'No videos with subtitles found for this channel' 
        })
      }

      contextText = recentVideos
        .map(video => `Video: ${video.videoTitle}\nDate: ${video.uploadDate.toDateString()}\nTranscript: ${video.subtitles?.substring(0, 1000)}...`)
        .join('\n\n---\n\n')
    }

    if (!contextText || contextText.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No context available. Provide videoId, channelName, or context text.' 
      })
    }

    // Validate maxTokens
    const maxTokensNum = parseInt(maxTokens)
    if (isNaN(maxTokensNum) || maxTokensNum < 50 || maxTokensNum > 1000) {
      return res.status(400).json({ 
        error: 'maxTokens must be between 50 and 1000' 
      })
    }

    // Truncate context if too long (keep within reasonable limits for API)
    const maxContextLength = 8000 // Roughly 2000 tokens
    if (contextText.length > maxContextLength) {
      contextText = contextText.substring(0, maxContextLength) + '...'
    }

    // Get answer from OpenAI
    const result = await answerQuestion({
      context: contextText,
      question,
      maxTokens: maxTokensNum,
    })

    res.status(200).json({
      question,
      answer: result.answer,
      confidence: result.confidence,
      metadata: {
        contextLength: contextText.length,
        videoId: videoId || null,
        channelName: channelName || null,
        timestamp: new Date().toISOString(),
        sources: result.sources,
      },
    })
  } catch (error) {
    console.error('Q&A error:', error)
    
    // Handle OpenAI specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      return res.status(500).json({
        error: 'AI service error',
        details: error.message || 'Failed to answer question',
        type: error.type,
      })
    }

    res.status(500).json({ 
      error: 'Q&A failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
