import { NextApiRequest, NextApiResponse } from 'next'
import { JobManager } from '../../lib/queue'
import { getCaptionRecheckStats } from '../../lib/jobs/caption-recheck'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleRecheckRequest(req, res)
  } else if (req.method === 'GET') {
    return handleGetStats(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleRecheckRequest(req: NextApiRequest, res: NextApiResponse) {
  const { channelId, videoIds, recheckAll = false } = req.body

  try {
    // Validate input
    if (!channelId && (!videoIds || videoIds.length === 0)) {
      return res.status(400).json({ 
        error: 'Either channelId or videoIds must be provided' 
      })
    }

    // Check for existing active caption recheck jobs
    const activeJobs = await JobManager.getActiveJobs()
    const existingJob = activeJobs.find(job => {
      if (job.type !== 'caption-recheck') return false
      
      const jobData = job.data as any
      if (channelId && jobData.channelId === channelId) return true
      if (videoIds && jobData.videoIds && 
          videoIds.some((id: string) => jobData.videoIds.includes(id))) return true
      
      return false
    })

    if (existingJob) {
      return res.status(409).json({
        error: 'Caption recheck job already exists for this channel/videos',
        jobId: existingJob.id
      })
    }

    // Create background job for caption rechecking
    const jobId = await JobManager.createJob(
      'caption-recheck',
      {
        type: 'caption-recheck',
        channelId,
        videoIds,
        recheckAll,
      },
      2 // Medium priority
    )

    res.status(200).json({
      message: 'Caption recheck job created',
      jobId,
      channelId,
      videoCount: videoIds?.length || 'all videos in channel',
    })
  } catch (error) {
    console.error('Error creating caption recheck job:', error)
    res.status(500).json({ 
      error: 'Failed to create caption recheck job',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleGetStats(req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.query

  try {
    const stats = await getCaptionRecheckStats(
      typeof channelId === 'string' ? channelId : undefined
    )

    res.status(200).json({
      stats,
      message: channelId 
        ? `Caption statistics for channel ${channelId}`
        : 'Global caption statistics'
    })
  } catch (error) {
    console.error('Error getting caption stats:', error)
    res.status(500).json({ 
      error: 'Failed to get caption statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

