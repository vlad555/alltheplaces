#!/usr/bin/env node

/**
 * Quick setup script for Video Memory application
 * This script provides a simplified setup process without external dependencies
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
    return true
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    return false
  }
}

function checkFiles() {
  log('\n🔍 Checking project files...', 'cyan')
  
  const requiredFiles = [
    'package.json',
    'prisma/schema.prisma',
    '.env.example'
  ]
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  )
  
  if (missingFiles.length > 0) {
    log('❌ Missing required files:', 'red')
    missingFiles.forEach(file => {
      log(`   - ${file}`, 'red')
    })
    log('Please ensure all project files are in place', 'yellow')
    return false
  }
  
  log('✅ All required files found', 'green')
  return true
}

function setupEnvironment() {
  log('\n📝 Setting up environment file...', 'cyan')
  
  const envPath = path.join(process.cwd(), '.env.local')
  const examplePath = path.join(process.cwd(), '.env.example')
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath)
      log('✅ Created .env.local from .env.example', 'green')
      log('⚠️  Please edit .env.local with your API keys and database URL', 'yellow')
      return false // Need user to configure
    } else {
      log('❌ .env.example not found', 'red')
      return false
    }
  } else {
    log('✅ .env.local already exists', 'green')
    return true
  }
}

function installDependencies() {
  log('\n📦 Installing dependencies...', 'cyan')
  return runCommand('npm install', 'Installing npm packages')
}

function setupDatabase() {
  log('\n🗄️  Setting up database...', 'cyan')
  
  // Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    return false
  }
  
  // Push schema to database
  if (!runCommand('npx prisma db push', 'Pushing database schema')) {
    log('⚠️  Database push failed. Please check your DATABASE_URL in .env.local', 'yellow')
    return false
  }
  
  return true
}

function displayInstructions() {
  log('\n📋 Setup Instructions', 'cyan')
  log('===================', 'cyan')
  
  log('\n1. Configure Environment Variables:', 'bright')
  log('   Edit .env.local with your API keys:', 'blue')
  log('   - DATABASE_URL (PostgreSQL connection string)', 'blue')
  log('   - YOUTUBE_API_KEY (from Google Cloud Console)', 'blue')
  log('   - OPENAI_API_KEY (from OpenAI Platform)', 'blue')
  
  log('\n2. API Key Setup:', 'bright')
  log('   YouTube API:', 'blue')
  log('   - Go to https://console.cloud.google.com/', 'blue')
  log('   - Enable YouTube Data API v3', 'blue')
  log('   - Create an API key', 'blue')
  
  log('   OpenAI API:', 'blue')
  log('   - Go to https://platform.openai.com/', 'blue')
  log('   - Create an API key', 'blue')
  log('   - Add billing information', 'blue')
  
  log('\n3. Database Setup:', 'bright')
  log('   Local PostgreSQL:', 'blue')
  log('   - Install PostgreSQL', 'blue')
  log('   - Create database: CREATE DATABASE video_memory;', 'blue')
  
  log('   Or use cloud database:', 'blue')
  log('   - Supabase (free tier): https://supabase.com/', 'blue')
  log('   - PlanetScale: https://planetscale.com/', 'blue')
  log('   - Railway: https://railway.app/', 'blue')
  
  log('\n4. After configuring .env.local:', 'bright')
  log('   npm run setup        # Complete database setup', 'blue')
  log('   npm run dev          # Start development server', 'blue')
}

function displayNextSteps() {
  log('\n🎉 Quick Setup Completed!', 'green')
  log('\nNext steps:', 'cyan')
  log('1. Configure your .env.local file with API keys', 'blue')
  log('2. Run: npm run setup (for database setup)', 'blue')
  log('3. Run: npm run dev (to start the application)', 'blue')
  
  log('\nUseful commands:', 'cyan')
  log('- npm run db:studio    # View database in browser', 'blue')
  log('- npm run dev          # Start development server', 'blue')
  log('- npm run build        # Build for production', 'blue')
}

async function main() {
  log('🚀 Video Memory Quick Setup', 'bright')
  log('============================', 'bright')
  
  // Check if we're in the right directory
  if (!checkFiles()) {
    log('\n❌ Setup failed: Missing project files', 'red')
    log('Please ensure you\'re in the correct project directory', 'yellow')
    process.exit(1)
  }
  
  // Install dependencies first
  if (!installDependencies()) {
    log('\n❌ Failed to install dependencies', 'red')
    process.exit(1)
  }
  
  // Setup environment file
  const envConfigured = setupEnvironment()
  
  if (envConfigured) {
    // Try to setup database if environment is configured
    if (setupDatabase()) {
      displayNextSteps()
    } else {
      log('\n⚠️  Database setup failed', 'yellow')
      log('Please check your DATABASE_URL and try again', 'yellow')
      displayInstructions()
    }
  } else {
    // Show configuration instructions
    displayInstructions()
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Setup failed: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { main }

