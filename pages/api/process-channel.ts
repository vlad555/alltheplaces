import { NextApiRequest, NextApiResponse } from 'next'
import { JobManager } from '../../lib/queue'
import { youtubeService } from '../../lib/youtube'
import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { channelUrl, maxVideos = 50 } = req.body

  if (!channelUrl) {
    return res.status(400).json({ error: 'Channel URL is required' })
  }

  try {
    // Extract channel identifier
    const channelIdentifier = youtubeService.extractChannelId(channelUrl) || channelUrl
    
    // Get channel info first to validate the channel
    const channelInfo = await youtubeService.getChannelInfo(channelIdentifier)
    
    // Check if channel is already being processed
    const existingChannel = await prisma.channel.findUnique({
      where: { channelId: channelInfo.id }
    })

    if (existingChannel?.isProcessing) {
      return res.status(409).json({ 
        error: 'Channel is already being processed',
        channelId: channelInfo.id 
      })
    }

    // Check for existing active jobs for this channel
    const activeJobs = await JobManager.getActiveJobs()
    const existingJob = activeJobs.find(job => 
      job.type === 'channel-processing' && 
      job.data && 
      (job.data as any).channelId === channelInfo.id
    )

    if (existingJob) {
      return res.status(409).json({
        error: 'Channel processing job already exists',
        jobId: existingJob.id,
        channelId: channelInfo.id
      })
    }

    // Create background job for channel processing
    const jobId = await JobManager.createJob(
      'channel-processing',
      {
        type: 'channel-processing',
        channelId: channelInfo.id,
        channelUrl,
        maxVideos,
      },
      1 // High priority
    )

    res.status(200).json({
      message: 'Channel processing job created',
      jobId,
      channelId: channelInfo.id,
      channelName: channelInfo.title,
      estimatedVideos: Math.min(channelInfo.videoCount, maxVideos),
    })
  } catch (error) {
    console.error('Error creating channel processing job:', error)
    res.status(500).json({ 
      error: 'Failed to create channel processing job',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


