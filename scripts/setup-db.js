#!/usr/bin/env node

/**
 * Database setup script for Video Memory application
 * This script helps set up the PostgreSQL database with proper indexes and configurations
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n${description}...`, 'blue')
  try {
    execSync(command, { stdio: 'inherit' })
    log(`✅ ${description} completed`, 'green')
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    throw error
  }
}

function checkEnvironment() {
  log('\n🔍 Checking environment...', 'cyan')
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red')
    log('Please copy .env.example to .env.local and fill in your values', 'yellow')
    process.exit(1)
  }
  
  // Load environment variables
  try {
    require('dotenv').config({ path: envPath })
  } catch (error) {
    log('❌ dotenv package not found. Installing dependencies...', 'yellow')
    log('Please run: npm install', 'blue')
    log('Then run this setup script again', 'blue')
    process.exit(1)
  }
  
  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'YOUTUBE_API_KEY',
    'OPENAI_API_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red')
    missingVars.forEach(varName => {
      log(`   - ${varName}`, 'red')
    })
    log('Please update your .env.local file', 'yellow')
    process.exit(1)
  }
  
  log('✅ Environment variables configured', 'green')
}

function setupDatabase() {
  log('\n🗄️  Setting up database...', 'cyan')
  
  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client')
  
  // Push schema to database
  runCommand('npx prisma db push', 'Pushing database schema')
  
  // Create additional indexes for better performance
  log('\n📊 Creating performance indexes...', 'blue')
  
  const indexQueries = [
    // Full-text search index for subtitles
    `CREATE INDEX IF NOT EXISTS idx_videos_subtitles_fts 
     ON videos USING gin(to_tsvector('english', subtitles))`,
    
    // Channel name index for faster channel queries
    `CREATE INDEX IF NOT EXISTS idx_videos_channel_name 
     ON videos(channel_name)`,
    
    // Upload date index for sorting
    `CREATE INDEX IF NOT EXISTS idx_videos_upload_date 
     ON videos(upload_date DESC)`,
    
    // Channel ID index
    `CREATE INDEX IF NOT EXISTS idx_videos_channel_id 
     ON videos(channel_id)`,
    
    // Composite index for channel + date queries
    `CREATE INDEX IF NOT EXISTS idx_videos_channel_date 
     ON videos(channel_name, upload_date DESC)`,
    
    // Index for videos with subtitles
    `CREATE INDEX IF NOT EXISTS idx_videos_has_subtitles 
     ON videos(channel_name) WHERE subtitles IS NOT NULL`,
  ]
  
  // Execute index creation queries
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  Promise.all(
    indexQueries.map(async (query) => {
      try {
        await prisma.$executeRawUnsafe(query)
        log(`✅ Index created successfully`, 'green')
      } catch (error) {
        if (error.message.includes('already exists')) {
          log(`ℹ️  Index already exists, skipping`, 'yellow')
        } else {
          log(`❌ Failed to create index: ${error.message}`, 'red')
        }
      }
    })
  ).then(() => {
    prisma.$disconnect()
    log('✅ Database indexes configured', 'green')
  }).catch((error) => {
    log(`❌ Error configuring indexes: ${error.message}`, 'red')
    prisma.$disconnect()
  })
}

function createSampleData() {
  log('\n📝 Would you like to create sample data? (y/N)', 'cyan')
  
  // For now, just log the option - in a real setup, you might want to add sample channels
  log('Sample data creation can be added here if needed', 'yellow')
  log('You can manually add channels through the web interface', 'blue')
}

function displayNextSteps() {
  log('\n🎉 Database setup completed!', 'green')
  log('\nNext steps:', 'cyan')
  log('1. Start the development server: npm run dev', 'blue')
  log('2. Open http://localhost:3000 in your browser', 'blue')
  log('3. Add a YouTube channel to start processing videos', 'blue')
  log('4. Use the search feature to find content in processed videos', 'blue')
  
  log('\nUseful commands:', 'cyan')
  log('- npm run db:studio    # Open Prisma Studio to view data', 'blue')
  log('- npm run db:migrate   # Run database migrations', 'blue')
  log('- npm run dev          # Start development server', 'blue')
  
  log('\nTroubleshooting:', 'cyan')
  log('- Check the README.md for detailed setup instructions', 'blue')
  log('- Verify your API keys are correct in .env.local', 'blue')
  log('- Ensure PostgreSQL is running and accessible', 'blue')
}

async function main() {
  log('🚀 Video Memory Database Setup', 'bright')
  log('================================', 'bright')
  
  try {
    checkEnvironment()
    setupDatabase()
    createSampleData()
    displayNextSteps()
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red')
    log('Please check the error above and try again', 'yellow')
    process.exit(1)
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main()
}

module.exports = {
  checkEnvironment,
  setupDatabase,
  displayNextSteps
}
