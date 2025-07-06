import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import Layout from '../components/Layout'
import ChannelForm from '../components/ChannelForm'
import StatusIndicator from '../components/StatusIndicator'
import { 
  Video, 
  Search, 
  Brain, 
  Database,
  Zap,
  Shield
} from 'lucide-react'

interface ChannelFormData {
  channelUrl: string
  maxVideos: number
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentChannelId, setCurrentChannelId] = useState<string>('')

  const handleChannelSubmit = async (data: ChannelFormData) => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/process-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process channel')
      }

      const result = await response.json()
      setCurrentChannelId(result.channelId)
      
      toast.success(`Started processing ${result.channelName}`)
    } catch (error) {
      throw error // Re-throw to let ChannelForm handle it
    } finally {
      setIsProcessing(false)
    }
  }

  const features = [
    {
      icon: Video,
      title: 'YouTube Integration',
      description: 'Automatically fetch all videos from any YouTube channel and download available subtitles.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Search through video subtitles with context-aware results and relevance scoring.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Generate summaries, ask questions, and get AI-powered analysis of video content.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Database,
      title: 'Persistent Storage',
      description: 'All video data and subtitles are stored in PostgreSQL for fast, reliable access.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Background processing with real-time status updates and progress tracking.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Shield,
      title: 'Reliable & Secure',
      description: 'Built with modern technologies and best practices for security and reliability.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  return (
    <Layout
      title="Video Memory - YouTube Subtitle Search"
      description="Search YouTube video subtitles with AI-powered insights. Process entire channels and find specific content instantly."
    >
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Search YouTube</span>
            <span className="block text-primary-600">Video Subtitles</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Process entire YouTube channels, search through video subtitles, and get AI-powered insights. 
            Find exactly what you're looking for across hours of video content.
          </p>
        </div>

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <ChannelForm 
            onSubmit={handleChannelSubmit}
            isLoading={isProcessing}
          />
        </div>

        {/* Status Indicator */}
        {currentChannelId && (
          <div className="max-w-2xl mx-auto">
            <StatusIndicator 
              channelId={currentChannelId}
              onStatusChange={(status) => {
                if (!status.isProcessing && status.totalVideos > 0) {
                  toast.success(`Processing completed! ${status.videosWithSubtitles} videos with subtitles available.`)
                }
              }}
            />
          </div>
        )}

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to search and analyze YouTube video content
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full mb-4">
                <span className="text-xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add Channel
              </h3>
              <p className="text-gray-600">
                Enter a YouTube channel URL and select how many videos to process
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full mb-4">
                <span className="text-xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wait for Processing
              </h3>
              <p className="text-gray-600">
                Our system downloads video metadata and subtitles automatically
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full mb-4">
                <span className="text-xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Search & Analyze
              </h3>
              <p className="text-gray-600">
                Search through subtitles and get AI-powered insights
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Search Video Content?
          </h2>
          <p className="text-primary-100 mb-6">
            Start by adding a YouTube channel above, or search existing processed channels.
          </p>
          <a
            href="/search"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors"
          >
            <Search className="h-5 w-5 mr-2" />
            Search Existing Channels
          </a>
        </div>
      </div>
    </Layout>
  )
}
