import { NextApiRequest, NextApiResponse } from 'next'
import { searchSubtitles, getChannelStats } from '../../lib/db'
import { generateSearchSuggestions } from '../../lib/openai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    channel, 
    q: query, 
    limit = '20',
    suggestions = 'false' 
  } = req.query

  if (!channel || !query) {
    return res.status(400).json({ 
      error: 'Channel name and search query are required' 
    })
  }

  if (typeof channel !== 'string' || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid parameters' 
    })
  }

  try {
    const searchLimit = Math.min(parseInt(limit as string) || 20, 100)
    
    // Perform the search
    const results = await searchSubtitles(channel, query, searchLimit)
    
    // Get channel statistics
    const stats = await getChannelStats(channel)
    
    // Generate search suggestions if requested
    let searchSuggestions: string[] = []
    if (suggestions === 'true' && results.length > 0) {
      try {
        const sampleSubtitles = results
          .slice(0, 3)
          .map(r => r.subtitles || '')
          .filter(Boolean)
        
        if (sampleSubtitles.length > 0) {
          searchSuggestions = await generateSearchSuggestions(query, sampleSubtitles)
        }
      } catch (error) {
        console.warn('Failed to generate search suggestions:', error)
      }
    }

    // Format results for frontend
    const formattedResults = results.map(video => ({
      id: video.id,
      videoId: video.videoId,
      title: video.videoTitle,
      channelName: video.channelName,
      uploadDate: video.uploadDate,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      duration: video.duration,
      fragment: video.fragment,
      // Calculate relevance score based on fragment quality
      relevanceScore: calculateRelevanceScore(video.fragment, query),
    }))

    // Sort by relevance score
    formattedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    res.status(200).json({
      query,
      channel,
      results: formattedResults,
      totalResults: results.length,
      channelStats: stats,
      searchSuggestions,
      metadata: {
        searchTime: Date.now(),
        hasMore: results.length === searchLimit,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function calculateRelevanceScore(fragment: string, query: string): number {
  if (!fragment) return 0
  
  const lowerFragment = fragment.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  let score = 0
  
  // Exact phrase match gets highest score
  if (lowerFragment.includes(lowerQuery)) {
    score += 10
  }
  
  // Individual word matches
  const queryWords = lowerQuery.split(/\s+/)
  const fragmentWords = lowerFragment.split(/\s+/)
  
  for (const queryWord of queryWords) {
    if (queryWord.length < 3) continue // Skip very short words
    
    for (const fragmentWord of fragmentWords) {
      if (fragmentWord.includes(queryWord)) {
        score += 2
      } else if (queryWord.includes(fragmentWord) && fragmentWord.length > 2) {
        score += 1
      }
    }
  }
  
  // Bonus for longer fragments (more context)
  if (fragment.length > 200) score += 1
  if (fragment.length > 400) score += 1
  
  return score
}
