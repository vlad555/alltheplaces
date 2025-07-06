import { google } from 'googleapis'
import { YoutubeTranscript } from 'youtube-transcript'
import {
  YouTubeVideo,
  YouTubeChannel,
  VideoSubtitles,
  ProcessingStatus,
  YouTubeError,
} from '../types/youtube'

class YouTubeService {
  private youtube
  private apiKey: string

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY!
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured')
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    })
  }

  /**
   * Extract channel ID from various YouTube URL formats
   */
  extractChannelId(url: string): string | null {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Get channel information by ID or handle
   */
  async getChannelInfo(channelIdentifier: string): Promise<YouTubeChannel> {
    try {
      let response

      // Try different methods to get channel info
      if (channelIdentifier.startsWith('UC') || channelIdentifier.length === 24) {
        // It's likely a channel ID
        response = await this.youtube.channels.list({
          part: ['snippet', 'statistics'],
          id: [channelIdentifier],
        })
      } else {
        // Try by username/handle
        response = await this.youtube.channels.list({
          part: ['snippet', 'statistics'],
          forUsername: channelIdentifier,
        })

        // If not found, try by custom URL
        if (!response.data.items?.length) {
          const searchResponse = await this.youtube.search.list({
            part: ['snippet'],
            q: channelIdentifier,
            type: ['channel'],
            maxResults: 1,
          })

          if (searchResponse.data.items?.length) {
            const channelId = searchResponse.data.items[0].snippet?.channelId
            if (channelId) {
              response = await this.youtube.channels.list({
                part: ['snippet', 'statistics'],
                id: [channelId],
              })
            }
          }
        }
      }

      if (!response.data.items?.length) {
        throw new Error('Channel not found')
      }

      const channel = response.data.items[0]
      const snippet = channel.snippet!
      const statistics = channel.statistics!

      return {
        id: channel.id!,
        title: snippet.title!,
        description: snippet.description || '',
        thumbnailUrl: snippet.thumbnails?.high?.url || '',
        subscriberCount: parseInt(statistics.subscriberCount || '0'),
        videoCount: parseInt(statistics.videoCount || '0'),
        url: `https://www.youtube.com/channel/${channel.id}`,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get all videos from a channel
   */
  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      const videos: YouTubeVideo[] = []
      let nextPageToken: string | undefined

      do {
        const response = await this.youtube.search.list({
          part: ['snippet'],
          channelId,
          type: ['video'],
          order: 'date',
          maxResults: Math.min(maxResults - videos.length, 50),
          pageToken: nextPageToken,
        })

        if (!response.data.items?.length) break

        // Get detailed video information
        const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean)
        
        if (videoIds.length > 0) {
          const detailsResponse = await this.youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: videoIds,
          })

          for (const video of detailsResponse.data.items || []) {
            const snippet = video.snippet!
            const statistics = video.statistics!
            const contentDetails = video.contentDetails!

            const publishDate = new Date(snippet.publishedAt!)
            
            videos.push({
              id: video.id!,
              title: snippet.title!,
              description: snippet.description || '',
              publishedAt: snippet.publishedAt!,
              publishDate,
              uploadDate: publishDate, // Same as publishDate
              thumbnailUrl: snippet.thumbnails?.high?.url || '',
              duration: contentDetails.duration || '',
              viewCount: parseInt(statistics.viewCount || '0'),
              channelId: snippet.channelId!,
              channelTitle: snippet.channelTitle!,
              url: `https://www.youtube.com/watch?v=${video.id}`,
            })
          }
        }

        nextPageToken = response.data.nextPageToken
      } while (nextPageToken && videos.length < maxResults)

      return videos
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get subtitles for a video
   */
  async getVideoSubtitles(videoId: string, includeAutoGenerated: boolean = true): Promise<VideoSubtitles | null> {
    try {
      // Try to get transcript using youtube-transcript library
      let transcript
      let isAutoGenerated = false
      
      try {
        // First try to get manual captions
        transcript = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'en',
          country: 'US',
        })
      } catch (error) {
        if (includeAutoGenerated) {
          try {
            // Try auto-generated captions
            transcript = await YoutubeTranscript.fetchTranscript(videoId)
            isAutoGenerated = true
          } catch (autoError) {
            console.warn(`No captions available for video ${videoId}`)
            return null
          }
        } else {
          return null
        }
      }

      if (!transcript || transcript.length === 0) {
        return null
      }

      // Combine transcript segments into full text
      const subtitles = transcript
        .map(segment => segment.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      return {
        videoId,
        subtitles,
        language: isAutoGenerated ? 'en (auto-generated)' : 'en',
        isAutoGenerated,
      }
    } catch (error) {
      console.warn(`Failed to get subtitles for video ${videoId}:`, error)
      return null
    }
  }

  /**
   * Process entire channel - get videos and subtitles
   */
  async processChannel(
    channelUrl: string,
    onProgress?: (status: ProcessingStatus) => void,
    maxVideos: number = 100
  ): Promise<ProcessingStatus> {
    const startTime = new Date()
    let status: ProcessingStatus = {
      channelId: '',
      channelName: '',
      totalVideos: 0,
      processedVideos: 0,
      videosWithSubtitles: 0,
      status: 'idle',
      startTime,
    }

    try {
      // Extract channel identifier from URL
      const channelIdentifier = this.extractChannelId(channelUrl) || channelUrl
      
      status.status = 'fetching_videos'
      onProgress?.(status)

      // Get channel info
      const channelInfo = await this.getChannelInfo(channelIdentifier)
      status.channelId = channelInfo.id
      status.channelName = channelInfo.title

      // Get channel videos
      const videos = await this.getChannelVideos(channelInfo.id, maxVideos)
      status.totalVideos = videos.length
      status.status = 'processing_subtitles'
      onProgress?.(status)

      // Process each video for subtitles
      const results = []
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        status.currentVideo = video.title
        status.processedVideos = i + 1
        
        // Calculate estimated time remaining
        if (i > 0) {
          const elapsed = Date.now() - startTime.getTime()
          const avgTimePerVideo = elapsed / i
          const remainingVideos = videos.length - i
          status.estimatedTimeRemaining = Math.round((avgTimePerVideo * remainingVideos) / 1000)
        }
        
        onProgress?.(status)

        try {
          const subtitles = await this.getVideoSubtitles(video.id)
          
          results.push({
            video,
            subtitles: subtitles?.subtitles || null,
          })

          if (subtitles) {
            status.videosWithSubtitles++
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.warn(`Failed to process video ${video.id}:`, error)
          results.push({
            video,
            subtitles: null,
          })
        }
      }

      status.status = 'completed'
      status.currentVideo = undefined
      onProgress?.(status)

      return status
    } catch (error) {
      status.status = 'error'
      status.error = error instanceof Error ? error.message : 'Unknown error'
      onProgress?.(status)
      throw this.handleError(error)
    }
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }

  /**
   * Format duration seconds to readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  private handleError(error: any): YouTubeError {
    if (error.response?.data?.error) {
      return {
        message: error.response.data.error.message,
        code: error.response.data.error.code,
        details: error.response.data.error,
      }
    }

    return {
      message: error.message || 'An unknown YouTube API error occurred',
      code: 'unknown_error',
      details: error,
    }
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService()

// Export utility functions
export const extractChannelId = (url: string) => youtubeService.extractChannelId(url)
export const getChannelInfo = (channelId: string) => youtubeService.getChannelInfo(channelId)
export const getChannelVideos = (channelId: string, maxResults?: number) => 
  youtubeService.getChannelVideos(channelId, maxResults)
export const getVideoSubtitles = (videoId: string) => youtubeService.getVideoSubtitles(videoId)
export const processChannel = (
  channelUrl: string, 
  onProgress?: (status: ProcessingStatus) => void,
  maxVideos?: number
) => youtubeService.processChannel(channelUrl, onProgress, maxVideos)
