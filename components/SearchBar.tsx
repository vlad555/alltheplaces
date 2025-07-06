import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react'

interface SearchFormData {
  channel: string
  query: string
}

interface SearchBarProps {
  onSearch: (data: SearchFormData) => Promise<void>
  isLoading?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
}

export default function SearchBar({ 
  onSearch, 
  isLoading = false, 
  suggestions = [],
  onSuggestionClick 
}: SearchBarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SearchFormData>()

  const queryValue = watch('query')

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0 && queryValue && queryValue.length > 0)
  }, [suggestions, queryValue])

  const handleFormSubmit = async (data: SearchFormData) => {
    setIsSubmitting(true)
    setShowSuggestions(false)
    try {
      await onSearch(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setValue('query', suggestion)
    setShowSuggestions(false)
    onSuggestionClick?.(suggestion)
  }

  const disabled = isLoading || isSubmitting

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Search className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Search Video Subtitles
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
            Channel Name
          </label>
          <input
            {...register('channel', {
              required: 'Channel name is required',
              minLength: { value: 2, message: 'Channel name must be at least 2 characters' },
            })}
            type="text"
            id="channel"
            placeholder="Enter the YouTube channel name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.channel ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={disabled}
          />
          {errors.channel && (
            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.channel.message}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
            Search Query
          </label>
          <input
            {...register('query', {
              required: 'Search query is required',
              minLength: { value: 2, message: 'Search query must be at least 2 characters' },
            })}
            type="text"
            id="query"
            placeholder="Enter keywords to search in video subtitles"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.query ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={disabled}
            onFocus={() => setShowSuggestions(suggestions.length > 0 && queryValue && queryValue.length > 0)}
          />
          {errors.query && (
            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.query.message}</span>
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3" />
                  <span>AI-powered suggestions</span>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Search Tips
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Use specific keywords for better results</li>
                  <li>Try different variations of your search terms</li>
                  <li>Search works on processed channels only</li>
                  <li>Results show subtitle fragments with context</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          }`}
        >
          {disabled ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Subtitles
            </>
          )}
        </button>
      </form>
    </div>
  )
}

