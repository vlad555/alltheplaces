import { Job as BullJob } from 'bullmq'
import { prisma } from '../db'
import { youtubeService } from '../youtube'
import { ProgressTracker, JobData } from '../queue'

export interface CaptionRecheckData extends JobData {
  channelId?: string
  videoIds?: string[]
  recheckAll?: boolean
  jobId: string
}

export async function recheckCaptionsJob(job: BullJob<CaptionRecheckData>) {
  const { channelId, videoIds, recheckAll, jobId } = job.data
  
  try {
    // Determine which videos to recheck
    let videosToRecheck
    
    if (videoIds && videoIds.length > 0) {
      // Recheck specific videos
      videosToRecheck = await prisma.video.findMany({
        where: {
          videoId: {
            in: videoIds,
          },
        },
      })
    } else if (channelId) {
      // Recheck videos from specific channel
      const whereClause: any = { channelId }
      
      if (!recheckAll) {
        // Only recheck videos without captions
        whereClause.hasCaption = false
      }
      
      videosToRecheck = await prisma.video.findMany({
        where: whereClause,
        orderBy: { uploadDate: 'desc' },
      })
    } else {
      // Recheck all videos without captions
      videosToRecheck = await prisma.video.findMany({
        where: {
          hasCaption: false,
        },
        orderBy: { uploadDate: 'desc' },
        take: 100, // Limit to prevent overwhelming the system
      })
    }

    const tracker = new ProgressTracker(jobId, videosToRecheck.length + 1)
    
    await tracker.updateStep(
      'Starting caption recheck',
      `Found ${videosToRecheck.length} videos to recheck`
    )

    let processedCount = 0
    let newCaptionsFound = 0
    const errors: string[] = []

    for (const video of videosToRecheck) {
      try {
        await tracker.updateStep(
          `Rechecking video ${processedCount + 1}/${videosToRecheck.length}`,
          `Checking: ${video.videoTitle.substring(0, 50)}...`
        )

        let subtitles: string | null = null
        let hasCaption = false
        let captionLanguage: string | null = null

        // Try to get subtitles with different strategies
        try {
          // First try: Get subtitles normally
          const subtitleData = await youtubeService.getVideoSubtitles(video.videoId)
          if (subtitleData) {
            subtitles = subtitleData.text
            hasCaption = true
            captionLanguage = subtitleData.language
            newCaptionsFound++
          }
        } catch (error) {
          // Second try: Check for auto-generated captions
          try {
            const autoSubtitleData = await youtubeService.getVideoSubtitles(video.videoId, true)
            if (autoSubtitleData) {
              subtitles = autoSubtitleData.text
              hasCaption = true
              captionLanguage = autoSubtitleData.language + ' (auto-generated)'
              newCaptionsFound++
            }
          } catch (autoError) {
            console.warn(`No captions available for video ${video.videoId}:`, autoError)
          }
        }

        // Update video record
        await prisma.video.update({
          where: { id: video.id },
          data: {
            subtitles,
            hasCaption,
            captionLanguage,
            lastCaptionCheck: new Date(),
            processingStatus: hasCaption ? 'completed' : 'no_captions',
            updatedAt: new Date(),
          },
        })

        processedCount++

        // Update progress
        const progressPercentage = Math.round((processedCount / videosToRecheck.length) * 100)
        await tracker.updateProgress(
          progressPercentage,
          `Processed ${processedCount}/${videosToRecheck.length}`,
          `${newCaptionsFound} new captions found`
        )

      } catch (error) {
        const errorMessage = `Failed to recheck captions for video ${video.videoTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
        console.error(errorMessage)
        
        // Update the video to mark the recheck attempt
        await prisma.video.update({
          where: { id: video.id },
          data: {
            lastCaptionCheck: new Date(),
            processingStatus: 'recheck_failed',
            updatedAt: new Date(),
          },
        })
        
        processedCount++
      }
    }

    await tracker.updateStep('Finalizing caption recheck', 'Completing process')

    // Complete the job
    const result = {
      totalVideosChecked: videosToRecheck.length,
      processedVideos: processedCount,
      newCaptionsFound,
      errors: errors.length > 0 ? errors : undefined,
    }

    await tracker.complete(result)

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during caption recheck'
    
    const tracker = new ProgressTracker(jobId, 1)
    await tracker.fail(errorMessage)
    throw error
  }
}

// Helper function to get videos that need caption rechecking
export async function getVideosNeedingCaptionRecheck(
  channelId?: string,
  limit: number = 100
) {
  const whereClause: any = {
    hasCaption: false,
  }

  if (channelId) {
    whereClause.channelId = channelId
  }

  // Also include videos that haven't been checked in the last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  return await prisma.video.findMany({
    where: {
      OR: [
        whereClause,
        {
          lastCaptionCheck: {
            lt: oneWeekAgo,
          },
          hasCaption: false,
        },
      ],
    },
    orderBy: { uploadDate: 'desc' },
    take: limit,
  })
}

// Helper function to get caption recheck statistics
export async function getCaptionRecheckStats(channelId?: string) {
  const whereClause = channelId ? { channelId } : {}

  const [
    totalVideos,
    videosWithCaptions,
    videosWithoutCaptions,
    videosNeverChecked,
    videosCheckedRecently,
  ] = await Promise.all([
    prisma.video.count({ where: whereClause }),
    prisma.video.count({ 
      where: { ...whereClause, hasCaption: true } 
    }),
    prisma.video.count({ 
      where: { ...whereClause, hasCaption: false } 
    }),
    prisma.video.count({ 
      where: { ...whereClause, lastCaptionCheck: null } 
    }),
    prisma.video.count({ 
      where: { 
        ...whereClause, 
        lastCaptionCheck: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        }
      } 
    }),
  ])

  return {
    totalVideos,
    videosWithCaptions,
    videosWithoutCaptions,
    videosNeverChecked,
    videosCheckedRecently,
    captionPercentage: totalVideos > 0 ? Math.round((videosWithCaptions / totalVideos) * 100) : 0,
  }
}

