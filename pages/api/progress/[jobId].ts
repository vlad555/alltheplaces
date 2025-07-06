import { NextApiRequest, NextApiResponse } from 'next'
import { JobManager } from '../../../lib/queue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { jobId } = req.query

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  try {
    const job = await JobManager.getJobStatus(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

    // Send initial job status
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    sendEvent({
      type: 'status',
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        totalSteps: job.totalSteps,
        stepName: job.stepName,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        result: job.result,
      },
    })

    // If job is completed or failed, close the connection
    if (['completed', 'failed'].includes(job.status)) {
      res.end()
      return
    }

    // Poll for updates every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const updatedJob = await JobManager.getJobStatus(jobId)
        
        if (!updatedJob) {
          sendEvent({ type: 'error', message: 'Job not found' })
          clearInterval(pollInterval)
          res.end()
          return
        }

        sendEvent({
          type: 'status',
          job: {
            id: updatedJob.id,
            type: updatedJob.type,
            status: updatedJob.status,
            progress: updatedJob.progress,
            currentStep: updatedJob.currentStep,
            totalSteps: updatedJob.totalSteps,
            stepName: updatedJob.stepName,
            startedAt: updatedJob.startedAt,
            completedAt: updatedJob.completedAt,
            error: updatedJob.error,
            result: updatedJob.result,
          },
        })

        // Close connection when job is done
        if (['completed', 'failed'].includes(updatedJob.status)) {
          clearInterval(pollInterval)
          res.end()
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        sendEvent({ type: 'error', message: 'Failed to get job status' })
        clearInterval(pollInterval)
        res.end()
      }
    }, 2000)

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval)
    })

    req.on('end', () => {
      clearInterval(pollInterval)
    })

  } catch (error) {
    console.error('Error in progress API:', error)
    res.status(500).json({ 
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

