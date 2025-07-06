import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  Copy,
  CheckCircle
} from 'lucide-react'

interface AIModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  type: 'summarize' | 'qa'
}

export default function AIModal({ isOpen, onClose, videoId, type }: AIModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [question, setQuestion] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSummarize = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          style: 'detailed',
          maxLength: 800,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setResult(data.summary)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question')
      return
    }

    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/ai/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          question: question.trim(),
          maxTokens: 600,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get answer')
      }

      const data = await response.json()
      setResult(data.answer)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get answer')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleSubmit = () => {
    if (type === 'summarize') {
      handleSummarize()
    } else {
      handleAskQuestion()
    }
  }

  const resetModal = () => {
    setResult('')
    setQuestion('')
    setLoading(false)
    setCopied(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            {type === 'summarize' ? (
              <>
                <Sparkles className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Summary
                </h2>
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Ask AI
                </h2>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {type === 'qa' && !result && (
            <div className="mb-4">
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to know about this video?
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What are the main points discussed? What is the conclusion?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                disabled={loading}
              />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary-600 mr-3" />
              <span className="text-gray-600">
                {type === 'summarize' ? 'Generating summary...' : 'Getting answer...'}
              </span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  {type === 'summarize' ? 'Summary:' : 'Answer:'}
                </h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4 border-l-4 border-primary-500">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result}
                </p>
              </div>

              {type === 'qa' && (
                <div className="text-xs text-gray-500">
                  <strong>Question:</strong> {question}
                </div>
              )}
            </div>
          )}

          {!loading && !result && type === 'summarize' && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Generate an AI-powered summary of this video's content
              </p>
              <p className="text-sm text-gray-500">
                The summary will be based on the video's subtitles and will highlight key points and insights.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Close
          </button>
          
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={loading || (type === 'qa' && !question.trim())}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                loading || (type === 'qa' && !question.trim())
                  ? 'bg-gray-400 cursor-not-allowed'
                  : type === 'summarize'
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : type === 'summarize' ? (
                'Generate Summary'
              ) : (
                'Ask Question'
              )}
            </button>
          )}

          {result && (
            <button
              onClick={resetModal}
              className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-100 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {type === 'summarize' ? 'New Summary' : 'Ask Another Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
