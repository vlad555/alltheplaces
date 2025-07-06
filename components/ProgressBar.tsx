import React from 'react'
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'

export interface ProgressBarProps {
  progress: number
  status: 'queued' | 'processing' | 'completed' | 'failed'
  currentStep?: number
  totalSteps?: number
  stepName?: string
  message?: string
  showDetails?: boolean
  className?: string
}

export default function ProgressBar({
  progress,
  status,
  currentStep,
  totalSteps,
  stepName,
  message,
  showDetails = true,
  className = '',
}: ProgressBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500'
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'processing':
        return 'Processing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">{getStatusText()}</span>
          {showDetails && currentStep && totalSteps && (
            <span className="text-sm text-gray-500">
              ({currentStep}/{totalSteps})
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-gray-900">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Step Information */}
      {showDetails && (stepName || message) && (
        <div className="space-y-1">
          {stepName && (
            <div className="text-sm font-medium text-gray-700">
              {stepName}
            </div>
          )}
          {message && (
            <div className="text-sm text-gray-500">
              {message}
            </div>
          )}
        </div>
      )}

      {/* Processing Animation */}
      {status === 'processing' && (
        <div className="mt-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline use
export function CompactProgressBar({
  progress,
  status,
  className = '',
}: Pick<ProgressBarProps, 'progress' | 'status' | 'className'>) {
  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500'
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 min-w-[3rem]">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

// Progress steps indicator
export function ProgressSteps({
  currentStep,
  totalSteps,
  steps,
  className = '',
}: {
  currentStep: number
  totalSteps: number
  steps?: string[]
  className?: string
}) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const stepName = steps?.[index]

          return (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepName && (
                <div className="mt-1 text-xs text-center text-gray-600 max-w-[80px]">
                  {stepName}
                </div>
              )}
              {index < totalSteps - 1 && (
                <div
                  className={`absolute h-0.5 w-16 mt-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

