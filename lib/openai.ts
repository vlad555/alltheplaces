import OpenAI from 'openai'
import {
  SummarizeRequest,
  SummarizeResponse,
  QARequest,
  QAResponse,
  VideoAnalysisRequest,
  VideoAnalysisResponse,
  OpenAIError,
} from '../types/openai'

class OpenAIService {
  private client: OpenAI
  private defaultModel = 'gpt-4-turbo-preview'

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async summarizeText({
    text,
    maxLength = 500,
    style = 'concise',
  }: SummarizeRequest): Promise<SummarizeResponse> {
    try {
      const stylePrompts = {
        concise: 'Provide a concise summary in paragraph form.',
        detailed: 'Provide a detailed summary with key insights and context.',
        'bullet-points': 'Provide a summary in bullet point format with key takeaways.',
      }

      const prompt = `
        Please summarize the following text in approximately ${maxLength} characters.
        ${stylePrompts[style]}
        
        Text to summarize:
        ${text}
        
        Summary:
      `

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates clear, accurate summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.ceil(maxLength / 3), // Rough estimate for token count
        temperature: 0.3,
      })

      const summary = response.choices[0]?.message?.content || ''
      
      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: text.length > 0 ? summary.length / text.length : 0,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async answerQuestion({
    context,
    question,
    maxTokens = 500,
  }: QARequest): Promise<QAResponse> {
    try {
      const prompt = `
        Based on the following context, please answer the question. If the answer cannot be found in the context, please say so.
        
        Context:
        ${context}
        
        Question: ${question}
        
        Answer:
      `

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on provided context. Be accurate and cite the context when possible.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
      })

      const answer = response.choices[0]?.message?.content || ''
      
      // Simple confidence scoring based on response characteristics
      const confidence = this.calculateConfidence(answer, context)
      
      return {
        answer,
        confidence,
        sources: [context.substring(0, 100) + '...'], // Simple source reference
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async analyzeVideo({
    videoTitle,
    subtitles,
    analysisType,
  }: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    const startTime = Date.now()
    
    try {
      const analysisPrompts = {
        summary: 'Provide a comprehensive summary of this video content.',
        'key-points': 'Extract the key points and main takeaways from this video.',
        topics: 'Identify the main topics and themes discussed in this video.',
        sentiment: 'Analyze the sentiment and tone of this video content.',
      }

      const prompt = `
        Video Title: ${videoTitle}
        
        Task: ${analysisPrompts[analysisType]}
        
        Video Subtitles:
        ${subtitles}
        
        Analysis:
      `

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert video content analyst. Provide ${analysisType} analysis that is insightful and well-structured.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      })

      const analysis = response.choices[0]?.message?.content || ''
      const processingTime = Date.now() - startTime
      
      return {
        analysis,
        metadata: {
          videoTitle,
          analysisType,
          processingTime,
          tokenCount: this.estimateTokenCount(prompt + analysis),
        },
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async generateSearchSuggestions(query: string, context: string[]): Promise<string[]> {
    try {
      const prompt = `
        Based on the search query "${query}" and the following video content context, suggest 5 related search terms that might help find relevant content.
        
        Context samples:
        ${context.slice(0, 3).join('\n---\n')}
        
        Provide only the search suggestions, one per line:
      `

      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates relevant search suggestions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.6,
      })

      const suggestions = response.choices[0]?.message?.content || ''
      return suggestions
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5)
    } catch (error) {
      console.error('Error generating search suggestions:', error)
      return []
    }
  }

  private calculateConfidence(answer: string, context: string): number {
    // Simple confidence calculation based on answer characteristics
    if (answer.toLowerCase().includes("i don't know") || 
        answer.toLowerCase().includes("cannot be found") ||
        answer.toLowerCase().includes("not mentioned")) {
      return 0.2
    }
    
    if (answer.toLowerCase().includes("based on the context") ||
        answer.toLowerCase().includes("according to")) {
      return 0.8
    }
    
    return 0.6 // Default confidence
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4)
  }

  private handleError(error: any): OpenAIError {
    if (error.response?.data?.error) {
      return {
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.data.error.code,
      }
    }
    
    return {
      message: error.message || 'An unknown error occurred',
      type: 'unknown_error',
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()

// Export individual functions for convenience
export const summarizeText = (request: SummarizeRequest) => 
  openaiService.summarizeText(request)

export const answerQuestion = (request: QARequest) => 
  openaiService.answerQuestion(request)

export const analyzeVideo = (request: VideoAnalysisRequest) => 
  openaiService.analyzeVideo(request)

export const generateSearchSuggestions = (query: string, context: string[]) =>
  openaiService.generateSearchSuggestions(query, context)
