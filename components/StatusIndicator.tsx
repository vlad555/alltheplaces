import React, { useEffect, useState } from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  BarChart3,
  Video
} from 'lucide-react'

interface ChannelStatus {
  channelId: string
  channelName: string
  isProcessing: boolean
  lastProcessed?: string
  totalVideos: number
  videosWithSubtitles: number
  subtitleCoverage: number
  estimatedTotalVideos?: number
  recentVideos?: Array<{
    title: string
    uploadDate: string
    hasSubtitles: boolean
  }>
}

interface StatusIndicatorProps {
  channelId?: string
  onStatusChange?: (status: ChannelStatus) => void
  refreshInterval?: number
}

export default function StatusIndicator({ 
  channelId, 
  onStatusChange,
  refreshInterval = 5000 
}: StatusIndicatorProps) {
  const [status, setStatus] = useState<ChannelStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    if (!channelId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/status/${channelId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      
      const data = await response.json()
      setStatus(data)
      onStatusChange?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!channelId) return

    // Initial fetch
    fetchStatus()

    // Set up polling for processing status
    const interval = setInterval(fetchStatus, refreshInterval)

    return () => clearInterval(interval)
  }, [channelId, refreshInterval])

  if (!channelId) {
    return null
  }

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading channel status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading status: {error}</span>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const getStatusIcon = () => {
    if (status.isProcessing) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }
    if (status.totalVideos > 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <Clock className="h-5 w-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (status.isProcessing) {
      return 'Processing videos...'
    }
    if (status.totalVideos > 0) {
      return 'Processing completed'
    }
    return 'No videos processed yet'
  }

  const getStatusColor = () => {
    if (status.isProcessing) return 'border-blue-200 bg-blue-50'
    if (status.totalVideos > 0) return 'border-green-200 bg-green-50'
    return 'border-gray-200 bg-gray-50'
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-gray-900">
            {status.channelName}
          </h3>
        </div>
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Video className="h-4 w-4 text-gray-600" />
          </div>
          <div className="font-semibold text-gray-900">
            {status.totalVideos}
          </div>
          <div className="text-xs text-gray-600">Processed</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="font-semibold text-gray-900">
            {status.videosWithSubtitles}
          </div>
          <div className="text-xs text-gray-600">With Subtitles</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="font-semibold text-gray-900">
            {status.subtitleCoverage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Coverage</div>
        </div>
        
        {status.estimatedTotalVideos && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="font-semibold text-gray-900">
              {status.estimatedTotalVideos}
            </div>
            <div className="text-xs text-gray-600">Total Expected</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status.estimatedTotalVideos && status.estimatedTotalVideos > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {status.totalVideos} / {status.estimatedTotalVideos}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  (status.totalVideos / status.estimatedTotalVideos) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Videos */}
      {status.recentVideos && status.recentVideos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Recent Videos:
          </h4>
          <div className="space-y-1">
            {status.recentVideos.slice(0, 3).map((video, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate flex-1 mr-2">
                  {video.title}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-xs">
                    {new Date(video.uploadDate).toLocaleDateString()}
                  </span>
                  {video.hasSubtitles ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Processed */}
      {status.lastProcessed && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last processed: {new Date(status.lastProcessed).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

