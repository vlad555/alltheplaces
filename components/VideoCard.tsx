import React, { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { 
  ExternalLink, 
  Calendar, 
  Eye, 
  Clock, 
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface VideoCardProps {
  id: string
  videoId: string
  title: string
  channelName: string
  uploadDate: string
  videoUrl: string
  thumbnailUrl?: string
  viewCount?: number
  duration?: number
  fragment?: string
  relevanceScore?: number
  onSummarize?: (videoId: string) => void
  onAskQuestion?: (videoId: string) => void
}

export default function VideoCard({
  id,
  videoId,
  title,
  channelName,
  uploadDate,
  videoUrl,
  thumbnailUrl,
  viewCount,
  duration,
  fragment,
  relevanceScore,
  onSummarize,
  onAskQuestion,
}: VideoCardProps) {
  const [showFullFragment, setShowFullFragment] = useState(false)
  const [isLoadingAI, setIsLoadingAI] = useState(false)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatViewCount = (count?: number) => {
    if (!count) return 'No views'
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`
    }
    return `${count} views`
  }

  const handleSummarize = async () => {
    if (!onSummarize) return
    setIsLoadingAI(true)
    try {
      await onSummarize(videoId)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!onAskQuestion) return
    setIsLoadingAI(true)
    try {
      await onAskQuestion(videoId)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const truncatedFragment = fragment && fragment.length > 200 
    ? fragment.substring(0, 200) + '...' 
    : fragment

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="sm:w-48 sm:flex-shrink-0">
          <div className="relative h-32 sm:h-full">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
            )}
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                {formatDuration(duration)}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {title}
            </h3>
            {relevanceScore && relevanceScore > 0 && (
              <div className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                {relevanceScore.toFixed(1)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <span className="font-medium">{channelName}</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(uploadDate), 'MMM d, yyyy')}</span>
            </div>
            {viewCount && (
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{formatViewCount(viewCount)}</span>
              </div>
            )}
          </div>

          {/* Fragment */}
          {fragment && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Matching Content:
              </h4>
              <div className="bg-gray-50 rounded-md p-3 border-l-4 border-primary-500">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {showFullFragment ? fragment : truncatedFragment}
                </p>
                {fragment.length > 200 && (
                  <button
                    onClick={() => setShowFullFragment(!showFullFragment)}
                    className="mt-2 flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-xs"
                  >
                    {showFullFragment ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        <span>Show more</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Watch Video</span>
            </a>

            {onSummarize && (
              <button
                onClick={handleSummarize}
                disabled={isLoadingAI}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Summarize</span>
              </button>
            )}

            {onAskQuestion && (
              <button
                onClick={handleAskQuestion}
                disabled={isLoadingAI}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

