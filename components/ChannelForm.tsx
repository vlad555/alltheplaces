import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Youtube, Loader2, AlertCircle } from 'lucide-react'

interface ChannelFormData {
  channelUrl: string
  maxVideos: number
}

interface ChannelFormProps {
  onSubmit: (data: ChannelFormData) => Promise<void>
  isLoading?: boolean
}

export default function ChannelForm({ onSubmit, isLoading = false }: ChannelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChannelFormData>({
    defaultValues: {
      maxVideos: 50,
    },
  })

  const handleFormSubmit = async (data: ChannelFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      reset()
      toast.success('Channel processing started!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process channel')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateYouTubeUrl = (url: string) => {
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+/,
    ]
    
    return youtubePatterns.some(pattern => pattern.test(url)) || 
           'Please enter a valid YouTube channel URL'
  }

  const disabled = isLoading || isSubmitting

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Youtube className="h-6 w-6 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Add YouTube Channel
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="channelUrl" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Channel URL
          </label>
          <input
            {...register('channelUrl', {
              required: 'Channel URL is required',
              validate: validateYouTubeUrl,
            })}
            type="url"
            id="channelUrl"
            placeholder="https://www.youtube.com/@channelname or https://www.youtube.com/channel/UC..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.channelUrl ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={disabled}
          />
          {errors.channelUrl && (
            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.channelUrl.message}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="maxVideos" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Videos to Process
          </label>
          <select
            {...register('maxVideos', {
              required: 'Please select maximum videos',
              min: { value: 10, message: 'Minimum 10 videos' },
              max: { value: 500, message: 'Maximum 500 videos' },
            })}
            id="maxVideos"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.maxVideos ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={disabled}
          >
            <option value={25}>25 videos</option>
            <option value={50}>50 videos</option>
            <option value={100}>100 videos</option>
            <option value={200}>200 videos</option>
            <option value={500}>500 videos</option>
          </select>
          {errors.maxVideos && (
            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.maxVideos.message}</span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Processing Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Processing may take several minutes depending on channel size</li>
                  <li>Only videos with available subtitles will be searchable</li>
                  <li>You can search the channel once processing begins</li>
                  <li>Processing happens in the background</li>
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
              Processing...
            </>
          ) : (
            <>
              <Youtube className="h-4 w-4 mr-2" />
              Start Processing Channel
            </>
          )}
        </button>
      </form>
    </div>
  )
}

