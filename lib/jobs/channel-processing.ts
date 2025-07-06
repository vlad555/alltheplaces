import { Job as BullJob } from 'bullmq'
import { prisma } from '../db'
import { youtubeService } from '../youtube'
import { ProgressTracker, JobData } from '../queue'
import { toast } from 'react-hot-toast'

export interface ChannelProcessingData extends JobData {
  channelUrl: string
  maxVideos: number
  jobId: string
}

export async function processChannelJob(job: BullJob<ChannelProcessingData>) {
  const { channelUrl, maxVideos, jobId } = job.data
  const tracker = new ProgressTracker(jobId, maxVideos + 3)

  try {
    await tracker.updateStep('Initializing channel processing', `Processing channel: ${channelUrl}`)

    // Extract channel ID from URL
    const channelId = youtubeService.extractChannelId(channelUrl)
    if (!channelId) {
      throw new Error('Invalid channel URL')
    }

    await tracker.updateStep('Fetching channel information')

    // Get channel info
    const channelInfo = await youtubeService.getChannelInfo(channelId)
    
    // Create or update channel record
    const channel = await prisma.channel.upsert({
      where: { channelId },
      update: {
        channelName: channelInfo.name,
        channelUrl,
        description: channelInfo.description,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        thumbnailUrl: channelInfo.thumbnailUrl,
        lastProcessed: new Date(),
        isProcessing: true,
      },
      create: {
        channelId,
        channelName: channelInfo.name,
        channelUrl,
        description: channelInfo.description,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        thumbnailUrl: channelInfo.thumbnailUrl,
        lastProcessed: new Date(),
        isProcessing: true,
      },
    })

    await tracker.updateStep('Fetching video list', `Getting up to ${maxVideos} videos`)

    // Get videos from channel
    const videos = await youtubeService.getChannelVideos(channelId, maxVideos)
    
    let processedCount = 0
    let videosWithCaptions = 0
    const errors: string[] = []

    // Process each video
    for (const video of videos) {
      try {
        await tracker.updateStep(
          `Processing video ${processedCount + 1}/${videos.length}`,
          `Processing: ${video.title.substring(0, 50)}...`
        )

        // Check if video already exists
        const existingVideo = await prisma.video.findUnique({
          where: { videoId: video.id },
        })

        let subtitles: string | null = null
        let hasCaption = false
        let captionLanguage: string | null = null

        // Try to get subtitles
        try {
          const subtitleData = await youtubeService.getVideoSubtitles(video.id)
          if (subtitleData) {
            subtitles = subtitleData.text
            hasCaption = true
            captionLanguage = subtitleData.language
            videosWithCaptions++
          }
        } catch (error) {
          console.warn(`Failed to get subtitles for video ${video.id}:`, error)
        }

        // Create or update video record
        await prisma.video.upsert({
          where: { videoId: video.id },
          update: {
            videoTitle: video.title,
            channelName: channelInfo.name,
            channelId,
            uploadDate: video.uploadDate,
            publishingDate: video.publishDate, // Use the actual publishing date
            duration: video.duration,
            viewCount: video.viewCount,
            thumbnailUrl: video.thumbnailUrl,
            subtitles,
            hasCaption,
            captionLanguage,
            lastCaptionCheck: new Date(),
            processingStatus: 'completed',
            updatedAt: new Date(),
          },
          create: {
            videoId: video.id,
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
            videoTitle: video.title,
            channelName: channelInfo.name,
            channelId,
            uploadDate: video.uploadDate,
            publishingDate: video.publishDate,
            duration: video.duration,
            viewCount: video.viewCount,
            thumbnailUrl: video.thumbnailUrl,
            subtitles,
            hasCaption,
            captionLanguage,
            lastCaptionCheck: new Date(),
            processingStatus: 'completed',
          },
        })

        processedCount++

        // Update progress
        const progressPercentage = Math.round(((processedCount + 2) / (videos.length + 3)) * 100)
        await tracker.updateProgress(
          progressPercentage,
          `Processing video ${processedCount}/${videos.length}`,
          `${videosWithCaptions} videos with captions found`
        )

      } catch (error) {
        const errorMessage = `Failed to process video ${video.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
        console.error(errorMessage)
        
        // Still create the video record without subtitles
        await prisma.video.upsert({
          where: { videoId: video.id },
          update: {
            videoTitle: video.title,
            channelName: channelInfo.name,
            channelId,
            uploadDate: video.uploadDate,
            publishingDate: video.publishDate,
            duration: video.duration,
            viewCount: video.viewCount,
            thumbnailUrl: video.thumbnailUrl,
            hasCaption: false,
            lastCaptionCheck: new Date(),
            processingStatus: 'failed',
            updatedAt: new Date(),
          },
          create: {
            videoId: video.id,
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
            videoTitle: video.title,
            channelName: channelInfo.name,
            channelId,
            uploadDate: video.uploadDate,
            publishingDate: video.publishDate,
            duration: video.duration,
            viewCount: video.viewCount,
            thumbnailUrl: video.thumbnailUrl,
            hasCaption: false,
            lastCaptionCheck: new Date(),
            processingStatus: 'failed',
          },
        })
        
        processedCount++
      }
    }

    await tracker.updateStep('Finalizing processing', 'Updating channel status')

    // Update channel processing status
    await prisma.channel.update({
      where: { channelId },
      data: {
        isProcessing: false,
        lastProcessed: new Date(),
      },
    })

    // Complete the job
    const result = {
      channelId,
      channelName: channelInfo.name,
      totalVideos: videos.length,
      processedVideos: processedCount,
      videosWithCaptions,
      errors: errors.length > 0 ? errors : undefined,
    }

    await tracker.complete(result)

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Update channel status on error
    try {
      const channelId = youtubeService.extractChannelId(channelUrl)
      if (channelId) {
        await prisma.channel.update({
          where: { channelId },
          data: { isProcessing: false },
        })
      }
    } catch (updateError) {
      console.error('Failed to update channel status on error:', updateError)
    }

    await tracker.fail(errorMessage)
    throw error
  }
}

