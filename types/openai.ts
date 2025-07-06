export interface SummarizeRequest {
  text: string
  maxLength?: number
  style?: 'concise' | 'detailed' | 'bullet-points'
}

export interface SummarizeResponse {
  summary: string
  originalLength: number
  summaryLength: number
  compressionRatio: number
}

export interface QARequest {
  context: string
  question: string
  maxTokens?: number
}

export interface QAResponse {
  answer: string
  confidence: number
  sources?: string[]
}

export interface VideoAnalysisRequest {
  videoTitle: string
  subtitles: string
  analysisType: 'summary' | 'key-points' | 'topics' | 'sentiment'
}

export interface VideoAnalysisResponse {
  analysis: string
  metadata: {
    videoTitle: string
    analysisType: string
    processingTime: number
    tokenCount: number
  }
}

export interface OpenAIError {
  message: string
  type: string
  code?: string
}

