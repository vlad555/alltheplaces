import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { 
  Play, 
  Calendar, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface Video {
  id: string
  videoId: string
  videoTitle: string
  videoUrl: string
  channelName: string
  channelId: string
  publishingDate: string | null
  uploadDate: string
  hasCaption: boolean
  captionFileName: string | null
  captionLanguage: string | null
  thumbnailUrl: string | null
  duration: number | null
  viewCount: number | null
  processingStatus: string
  lastCaptionCheck: string | null
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface VideoListResponse {
  videos: Video[]
  pagination: PaginationInfo
  filters: {
    channelId: string | null
    hasCaption: string | null
    search: string | null
    sortBy: string
    sortOrder: string
  }
}

export default function VideosPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [captionFilter, setCaptionFilter] = useState('')
  const [sortBy, setSortBy] = useState('publishingDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch videos
  const fetchVideos = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })

      if (search.trim()) params.append('search', search.trim())
      if (channelFilter) params.append('channelId', channelFilter)
      if (captionFilter) params.append('hasCaption', captionFilter)

      const response = await fetch(`/api/videos?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data: VideoListResponse = await response.json()
      setVideos(data.videos)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      toast.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  // Initial load and when filters change
  useEffect(() => {
    fetchVideos(1)
  }, [search, channelFilter, captionFilter, sortBy, sortOrder])

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchVideos(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle recheck captions for a video
  const handleRecheckCaptions = async (videoId: string) => {
    try {
      const response = await fetch('/api/recheck-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: [videoId] }),
      })

      if (!response.ok) {
        throw new Error('Failed to start caption recheck')
      }

      const data = await response.json()
      toast.success(`Caption recheck started (Job ID: ${data.jobId})`)
      
      // Refresh the video list after a short delay
      setTimeout(() => fetchVideos(pagination?.currentPage || 1), 2000)
    } catch (err) {
      toast.error('Failed to start caption recheck')
    }
  }

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Format view count
  const formatViewCount = (count: number | null) => {
    if (!count) return '0'
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Layout>
      <Head>
        <title>Video Library - Video Memory</title>
        <meta name="description" content="Browse and manage your video collection" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Library</h1>
          <p className="text-gray-600">
            Browse and manage your video collection with captions and metadata
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search videos or channels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel ID
                </label>
                <input
                  type="text"
                  placeholder="Filter by channel ID"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Captions
                </label>
                <select
                  value={captionFilter}
                  onChange={(e) => setCaptionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All videos</option>
                  <option value="true">With captions</option>
                  <option value="false">Without captions</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="publishingDate">Publishing Date</option>
                  <option value="uploadDate">Upload Date</option>
                  <option value="videoTitle">Title</option>
                  <option value="channelName">Channel</option>
                  <option value="viewCount">View Count</option>
                  <option value="createdAt">Added Date</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading videos...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => fetchVideos(pagination?.currentPage || 1)}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results Summary */}
        {pagination && !loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} videos
          </div>
        )}

        {/* Video Grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.videoTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Duration overlay */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {video.videoTitle}
                  </h3>

                  {/* Channel */}
                  <p className="text-sm text-gray-600 mb-2">{video.channelName}</p>

                  {/* Metadata */}
                  <div className="space-y-2 text-xs text-gray-500">
                    {/* Publishing Date */}
                    {video.publishingDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Published: {format(new Date(video.publishingDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}

                    {/* View Count */}
                    {video.viewCount && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatViewCount(video.viewCount)} views</span>
                      </div>
                    )}

                    {/* Caption Status */}
                    <div className="flex items-center space-x-1">
                      {video.hasCaption ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-600">
                            Captions available ({video.captionLanguage})
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-red-600">No captions</span>
                        </>
                      )}
                    </div>

                    {/* Last Caption Check */}
                    {video.lastCaptionCheck && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Last checked: {format(new Date(video.lastCaptionCheck), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Watch</span>
                    </a>

                    {!video.hasCaption && (
                      <button
                        onClick={() => handleRecheckCaptions(video.videoId)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Recheck</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600 mb-4">
              {search || channelFilter || captionFilter
                ? 'Try adjusting your search or filters'
                : 'Start by processing a YouTube channel to add videos'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Process Channel
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

