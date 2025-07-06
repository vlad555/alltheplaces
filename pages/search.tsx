import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import SearchResults from '../components/SearchResults'

interface SearchFormData {
  channel: string
  query: string
}

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

interface SearchResponse {
  query: string
  channel: string
  results: SearchResult[]
  totalResults: number
  channelStats?: ChannelStats
  searchSuggestions?: string[]
}

export default function Search() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [currentSearch, setCurrentSearch] = useState<SearchFormData | null>(null)

  const handleSearch = async (data: SearchFormData) => {
    setIsSearching(true)
    setCurrentSearch(data)
    
    try {
      const params = new URLSearchParams({
        channel: data.channel,
        q: data.query,
        suggestions: 'true',
        limit: '20',
      })

      const response = await fetch(`/api/search?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Search failed')
      }

      const results = await response.json()
      setSearchResults(results)
      
      if (results.totalResults === 0) {
        toast.error(`No results found for "${data.query}" in ${data.channel}`)
      } else {
        toast.success(`Found ${results.totalResults} results`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed')
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (currentSearch) {
      handleSearch({
        ...currentSearch,
        query: suggestion,
      })
    }
  }

  return (
    <Layout
      title="Search - Video Memory"
      description="Search through YouTube video subtitles to find specific content and get AI-powered insights."
    >
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Search Video Subtitles
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Search through processed YouTube channel subtitles to find specific content, 
            topics, or discussions. Get AI-powered insights and summaries.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isSearching}
            suggestions={searchResults?.searchSuggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Search Results */}
        {(searchResults || isSearching) && (
          <div className="max-w-6xl mx-auto">
            <SearchResults
              results={searchResults?.results || []}
              query={searchResults?.query || currentSearch?.query || ''}
              channel={searchResults?.channel || currentSearch?.channel || ''}
              totalResults={searchResults?.totalResults || 0}
              channelStats={searchResults?.channelStats}
              searchSuggestions={searchResults?.searchSuggestions}
              isLoading={isSearching}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>
        )}

        {/* Help Section */}
        {!searchResults && !isSearching && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Search Tips & Examples
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Search Examples
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900">Topic Search</div>
                      <div className="text-sm text-gray-600">
                        "machine learning", "climate change", "productivity tips"
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900">Question Search</div>
                      <div className="text-sm text-gray-600">
                        "how to", "what is", "why does"
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium text-gray-900">Specific Terms</div>
                      <div className="text-sm text-gray-600">
                        "React hooks", "investment strategy", "cooking technique"
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    AI Features
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                      <div className="font-medium text-blue-900">Smart Summaries</div>
                      <div className="text-sm text-blue-700">
                        Get AI-generated summaries of any video's content
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md border-l-4 border-green-500">
                      <div className="font-medium text-green-900">Ask Questions</div>
                      <div className="text-sm text-green-700">
                        Ask specific questions about video content
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-md border-l-4 border-purple-500">
                      <div className="font-medium text-purple-900">Search Suggestions</div>
                      <div className="text-sm text-purple-700">
                        Get AI-powered search suggestions based on your query
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">
                  💡 Pro Tips
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use specific keywords for better results</li>
                  <li>• Try different variations of your search terms</li>
                  <li>• Search results show context around matching text</li>
                  <li>• Use AI features to get deeper insights from videos</li>
                  <li>• Channel names are case-insensitive</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
