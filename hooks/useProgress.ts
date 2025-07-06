import { useState, useEffect, useRef } from 'react'

export interface JobStatus {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: number
  totalSteps: number
  stepName?: string
  startedAt?: string
  completedAt?: string
  error?: string
  result?: any
}

export interface ProgressEvent {
  type: 'status' | 'error'
  job?: JobStatus
  message?: string
}

export function useProgress(jobId: string | null) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setError(null)
      setIsConnected(false)
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create new EventSource connection
    const eventSource = new EventSource(`/api/progress/${jobId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data)
        
        if (data.type === 'status' && data.job) {
          setJob(data.job)
          setError(null)
        } else if (data.type === 'error') {
          setError(data.message || 'Unknown error occurred')
        }
      } catch (err) {
        console.error('Error parsing progress event:', err)
        setError('Failed to parse progress data')
      }
    }

    eventSource.onerror = (event) => {
      console.error('EventSource error:', event)
      setIsConnected(false)
      
      // Don't set error immediately, as this might be a temporary network issue
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setError('Connection lost')
        }
      }, 5000)
    }

    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [jobId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    job,
    error,
    isConnected,
    isLoading: jobId && !job && !error,
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
    isProcessing: job?.status === 'processing',
    isQueued: job?.status === 'queued',
  }
}

// Hook for managing multiple jobs
export function useMultipleProgress(jobIds: string[]) {
  const [jobs, setJobs] = useState<Record<string, JobStatus>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [connections, setConnections] = useState<Record<string, boolean>>({})
  const eventSourcesRef = useRef<Record<string, EventSource>>({})

  useEffect(() => {
    // Close connections for jobs that are no longer needed
    Object.keys(eventSourcesRef.current).forEach(jobId => {
      if (!jobIds.includes(jobId)) {
        eventSourcesRef.current[jobId]?.close()
        delete eventSourcesRef.current[jobId]
        
        setJobs(prev => {
          const { [jobId]: removed, ...rest } = prev
          return rest
        })
        setErrors(prev => {
          const { [jobId]: removed, ...rest } = prev
          return rest
        })
        setConnections(prev => {
          const { [jobId]: removed, ...rest } = prev
          return rest
        })
      }
    })

    // Create connections for new jobs
    jobIds.forEach(jobId => {
      if (!eventSourcesRef.current[jobId]) {
        const eventSource = new EventSource(`/api/progress/${jobId}`)
        eventSourcesRef.current[jobId] = eventSource

        eventSource.onopen = () => {
          setConnections(prev => ({ ...prev, [jobId]: true }))
          setErrors(prev => {
            const { [jobId]: removed, ...rest } = prev
            return rest
          })
        }

        eventSource.onmessage = (event) => {
          try {
            const data: ProgressEvent = JSON.parse(event.data)
            
            if (data.type === 'status' && data.job) {
              setJobs(prev => ({ ...prev, [jobId]: data.job! }))
            } else if (data.type === 'error') {
              setErrors(prev => ({ ...prev, [jobId]: data.message || 'Unknown error' }))
            }
          } catch (err) {
            console.error(`Error parsing progress event for job ${jobId}:`, err)
            setErrors(prev => ({ ...prev, [jobId]: 'Failed to parse progress data' }))
          }
        }

        eventSource.onerror = () => {
          setConnections(prev => ({ ...prev, [jobId]: false }))
          setTimeout(() => {
            if (eventSource.readyState === EventSource.CLOSED) {
              setErrors(prev => ({ ...prev, [jobId]: 'Connection lost' }))
            }
          }, 5000)
        }
      }
    })
  }, [jobIds])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(eventSourcesRef.current).forEach(eventSource => {
        eventSource.close()
      })
    }
  }, [])

  return {
    jobs,
    errors,
    connections,
    getJob: (jobId: string) => jobs[jobId] || null,
    getError: (jobId: string) => errors[jobId] || null,
    isConnected: (jobId: string) => connections[jobId] || false,
    isLoading: (jobId: string) => jobIds.includes(jobId) && !jobs[jobId] && !errors[jobId],
    isCompleted: (jobId: string) => jobs[jobId]?.status === 'completed',
    isFailed: (jobId: string) => jobs[jobId]?.status === 'failed',
    isProcessing: (jobId: string) => jobs[jobId]?.status === 'processing',
    isQueued: (jobId: string) => jobs[jobId]?.status === 'queued',
  }
}

// Utility hook for job statistics
export function useJobStats(jobs: Record<string, JobStatus>) {
  const stats = Object.values(jobs).reduce(
    (acc, job) => {
      acc.total++
      acc[job.status]++
      acc.totalProgress += job.progress
      return acc
    },
    {
      total: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalProgress: 0,
    }
  )

  return {
    ...stats,
    averageProgress: stats.total > 0 ? Math.round(stats.totalProgress / stats.total) : 0,
    completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    failureRate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
  }
}

