import { Queue, Worker, Job as BullJob } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from './db'

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
})

// Job types
export type JobType = 'channel-processing' | 'caption-recheck' | 'video-processing'

export interface JobData {
  type: JobType
  channelId?: string
  channelUrl?: string
  videoIds?: string[]
  maxVideos?: number
  recheckAll?: boolean
}

export interface JobProgress {
  percentage: number
  currentStep: number
  totalSteps: number
  stepName: string
  message?: string
}

// Create queues
export const videoQueue = new Queue('video-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

// Job management class
export class JobManager {
  static async createJob(
    type: JobType,
    data: JobData,
    priority: number = 0
  ): Promise<string> {
    // Create job in database
    const job = await prisma.job.create({
      data: {
        type,
        data: data as any,
        priority,
        status: 'queued',
        totalSteps: this.getTotalSteps(type, data),
      },
    })

    // Add to Bull queue
    await videoQueue.add(
      type,
      { ...data, jobId: job.id },
      {
        priority,
        jobId: job.id,
      }
    )

    return job.id
  }

  static async updateJobProgress(
    jobId: string,
    progress: Partial<JobProgress>,
    status?: string
  ): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (progress.percentage !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress.percentage))
    }

    if (progress.currentStep !== undefined) {
      updateData.currentStep = progress.currentStep
    }

    if (progress.stepName !== undefined) {
      updateData.stepName = progress.stepName
    }

    if (status) {
      updateData.status = status
      if (status === 'processing' && !updateData.startedAt) {
        updateData.startedAt = new Date()
      } else if (['completed', 'failed'].includes(status)) {
        updateData.completedAt = new Date()
      }
    }

    await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    })
  }

  static async completeJob(
    jobId: string,
    result?: any,
    error?: string
  ): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: error ? 'failed' : 'completed',
        result: result as any,
        error,
        completedAt: new Date(),
        progress: error ? undefined : 100,
      },
    })
  }

  static async getJobStatus(jobId: string) {
    return await prisma.job.findUnique({
      where: { id: jobId },
    })
  }

  static async getActiveJobs() {
    return await prisma.job.findMany({
      where: {
        status: {
          in: ['queued', 'processing'],
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    })
  }

  static async getJobHistory(limit: number = 50) {
    return await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  private static getTotalSteps(type: JobType, data: JobData): number {
    switch (type) {
      case 'channel-processing':
        return Math.max(data.maxVideos || 50, 10) + 2 // Videos + channel info + finalization
      case 'caption-recheck':
        return (data.videoIds?.length || 10) + 1 // Videos + finalization
      case 'video-processing':
        return 3 // Fetch metadata, fetch captions, save
      default:
        return 1
    }
  }
}

// Progress tracking utilities
export class ProgressTracker {
  private jobId: string
  private totalSteps: number
  private currentStep: number = 0

  constructor(jobId: string, totalSteps: number) {
    this.jobId = jobId
    this.totalSteps = totalSteps
  }

  async updateStep(stepName: string, message?: string): Promise<void> {
    this.currentStep++
    const percentage = Math.round((this.currentStep / this.totalSteps) * 100)

    await JobManager.updateJobProgress(
      this.jobId,
      {
        percentage,
        currentStep: this.currentStep,
        totalSteps: this.totalSteps,
        stepName,
        message,
      },
      'processing'
    )
  }

  async updateProgress(percentage: number, stepName?: string, message?: string): Promise<void> {
    await JobManager.updateJobProgress(
      this.jobId,
      {
        percentage: Math.round(percentage),
        stepName: stepName || `Step ${this.currentStep}`,
        message,
      }
    )
  }

  async complete(result?: any): Promise<void> {
    await JobManager.completeJob(this.jobId, result)
  }

  async fail(error: string): Promise<void> {
    await JobManager.completeJob(this.jobId, null, error)
  }
}

// Cleanup old jobs
export async function cleanupOldJobs(): Promise<void> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  await prisma.job.deleteMany({
    where: {
      status: {
        in: ['completed', 'failed'],
      },
      completedAt: {
        lt: oneWeekAgo,
      },
    },
  })
}

// Export Redis connection for other modules
export { redis }

