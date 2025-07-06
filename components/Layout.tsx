import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Search, Video, Brain, Library } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ 
  children, 
  title = 'Video Memory',
  description = 'Search YouTube video subtitles with AI-powered insights'
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Video className="h-8 w-8 text-primary-600" />
                  <span className="text-xl font-bold text-gray-900">
                    Video Memory
                  </span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Video className="h-4 w-4" />
                  <span>Add Channel</span>
                </Link>
                
                <Link
                  href="/videos"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Library className="h-4 w-4" />
                  <span>Videos</span>
                </Link>
                
                <Link
                  href="/search"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Link>

                <div className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-primary-600">
                  <Brain className="h-4 w-4" />
                  <span>AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500 text-sm">
              <p>
                Video Memory - Search YouTube subtitles with AI insights
              </p>
              <p className="mt-2">
                Powered by YouTube API, OpenAI, and PostgreSQL
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
