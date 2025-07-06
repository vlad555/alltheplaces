import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import VideoCard from './VideoCard'
import AIModal from './AIModal'
import { 
  Search, 
  AlertCircle, 
  BarChart3, 
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react'

interface SearchResult {
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
}

interface ChannelStats {
  totalVideos: number
  videosWithSubtitles: number
  subtitleCoverage: number
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  channel: string
  totalResults: number
  channelStats?: ChannelStats
  searchSuggestions?: string[]
  isLoading?: boolean
  onSuggestionClick?: (suggestion: string) => void
}

export default function SearchResults({
  results,
  query,
  channel,
  totalResults,
  channelStats,
  searchSuggestions = [],
  isLoading = false,
  onSuggestionClick,
}: SearchResultsProps) {
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiModalType, setAiModalType] = useState<'summarize' | 'qa'>('summarize')
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')

  const handleSummarize = async (videoId: string) => {
    setSelectedVideoId(videoId)
    setAiModalType('summarize')
    setAiModalOpen(true)
  }

  const handleAskQuestion = async (videoId: string) => {
    setSelectedVideoId(videoId)
    setAiModalType('qa')
    setAiModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      </div>
    )
  }

  if (!results.length && query) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 mb-4">
            No videos found matching "{query}" in {channel}
          </p>
          
          {searchSuggestions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                <Sparkles className="h-4 w-4 mr-1" />
                Try these AI-suggested searches:
              </h4>
              <div className="flex flex-wrap justify-center gap-2">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm hover:bg-primary-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {channelStats && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Channel Statistics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {channelStats.totalVideos}
                  </div>
                  <div className="text-gray-600">Total Videos</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {channelStats.videosWithSubtitles}
                  </div>
                  <div className="text-gray-600">With Subtitles</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {channelStats.subtitleCoverage.toFixed(1)}%
                  </div>
                  <div className="text-gray-600">Coverage</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              {totalResults} results for "{query}" in {channel}
            </div>
          </div>

          {/* Channel Stats */}
          {channelStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-900">
                    {channelStats.totalVideos}
                  </div>
                  <div className="text-sm text-blue-700">Total Videos</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">
                    {channelStats.videosWithSubtitles}
                  </div>
                  <div className="text-sm text-green-700">With Subtitles</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-md">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold text-purple-900">
                    {channelStats.subtitleCoverage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700">Coverage</div>
                </div>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                Related searches:
              </h4>
              <div className="flex flex-wrap gap-2">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((result) => (
            <VideoCard
              key={result.id}
              {...result}
              onSummarize={handleSummarize}
              onAskQuestion={handleAskQuestion}
            />
          ))}
        </div>

        {/* Load More Indicator */}
        {results.length > 0 && results.length < totalResults && (
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm">
              Showing {results.length} of {totalResults} results
            </p>
          </div>
        )}
      </div>

      {/* AI Modal */}
      <AIModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        videoId={selectedVideoId}
        type={aiModalType}
      />
    </>
  )
}

