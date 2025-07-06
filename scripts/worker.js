const { Worker } = require('bullmq')
const Redis = require('ioredis')

// Import job processors
const { processChannelJob } = require('../lib/jobs/channel-processing')
const { recheckCaptionsJob } = require('../lib/jobs/caption-recheck')

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
})

// Configuration
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 3
const JOB_TIMEOUT = parseInt(process.env.JOB_TIMEOUT_MS) || 300000 // 5 minutes

console.log('🚀 Starting Video Memory Background Worker')
console.log(`📊 Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`)
console.log(`⏱️  Job timeout: ${JOB_TIMEOUT}ms`)

// Create worker
const worker = new Worker(
  'video-processing',
  async (job) => {
    console.log(`🔄 Processing job ${job.id} of type: ${job.data.type}`)
    
    try {
      let result
      
      switch (job.data.type) {
        case 'channel-processing':
          result = await processChannelJob(job)
          break
          
        case 'caption-recheck':
          result = await recheckCaptionsJob(job)
          break
          
        default:
          throw new Error(`Unknown job type: ${job.data.type}`)
      }
      
      console.log(`✅ Completed job ${job.id}:`, result)
      return result
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection: redis,
    concurrency: MAX_CONCURRENT_JOBS,
    removeOnComplete: 50,
    removeOnFail: 20,
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 1,
    },
  }
)

// Worker event handlers
worker.on('ready', () => {
  console.log('✅ Worker is ready and waiting for jobs')
})

worker.on('active', (job) => {
  console.log(`🔄 Job ${job.id} is now active`)
})

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`)
  if (result) {
    console.log('📊 Result summary:', {
      type: job.data.type,
      ...result
    })
  }
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('stalled', (jobId) => {
  console.warn(`⚠️  Job ${jobId} stalled`)
})

worker.on('error', (err) => {
  console.error('💥 Worker error:', err)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  
  try {
    await worker.close()
    await redis.disconnect()
    console.log('✅ Worker shut down successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  
  try {
    await worker.close()
    await redis.disconnect()
    console.log('✅ Worker shut down successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
})

// Keep the process alive
console.log('🎯 Worker is running. Press Ctrl+C to stop.')

