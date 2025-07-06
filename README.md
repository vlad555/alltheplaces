# Video Memory 🎥

A full-stack web application that allows users to search through YouTube video subtitles with AI-powered insights. Built with Next.js, PostgreSQL, and OpenAI.

## Features ✨

- **YouTube Channel Processing**: Automatically fetch all videos from any YouTube channel
- **Subtitle Extraction**: Download and store subtitles for searchable content
- **Powerful Search**: Full-text search through video subtitles with context
- **AI Integration**: Generate summaries and ask questions about video content
- **Background Processing**: Robust job queue system with Redis and BullMQ
- **Real-time Progress**: Live progress tracking with Server-Sent Events
- **Video Management**: Browse, filter, and manage your video library
- **Caption Rechecking**: Automatically retry failed caption extractions
- **Advanced Filtering**: Search by channel, caption availability, date, and more
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack 🛠️

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: Redis + BullMQ for background processing
- **AI**: OpenAI GPT-4 for summaries and Q&A
- **APIs**: YouTube Data API v3, YouTube Transcript API
- **Real-time**: Server-Sent Events for progress tracking
- **Styling**: Tailwind CSS with Lucide React icons

## Prerequisites 📋

Before you begin, ensure you have the following installed:

- Node.js 18+ and npm
- PostgreSQL 12+
- Redis 6+ (for background processing)
- Git

You'll also need API keys for:
- YouTube Data API v3
- OpenAI API

## Quick Start 🚀

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd video-memory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/video_memory?schema=public"

# YouTube API
YOUTUBE_API_KEY="your_youtube_api_key_here"

# OpenAI API
OPENAI_API_KEY="your_openai_api_key_here"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

### 4. Set Up the Database

Create a PostgreSQL database and run the setup:

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your database
npm run db:push

# Or run migrations (alternative to db:push)
npm run db:migrate
```

### 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## API Keys Setup 🔑

### YouTube Data API v3

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Restrict the API key to YouTube Data API v3 (recommended)

### OpenAI API

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. Add billing information (required for API usage)

## Database Setup 💾

### Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE video_memory;
   ```
3. Update the `DATABASE_URL` in your `.env.local` file

### Cloud Database (Recommended for Production)

Consider using managed PostgreSQL services like:
- [Supabase](https://supabase.com/) (Free tier available)
- [PlanetScale](https://planetscale.com/)
- [Railway](https://railway.app/)
- [Neon](https://neon.tech/)

## Background Processing Setup 🔄

### Redis Setup

The application uses Redis for background job processing. You need to have Redis running:

#### Local Redis
```bash
# Install Redis (macOS)
brew install redis

# Install Redis (Ubuntu)
sudo apt-get install redis-server

# Start Redis
redis-server
```

#### Cloud Redis (Recommended for Production)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- [Upstash](https://upstash.com/)
- [Railway Redis](https://railway.app/)

### Starting the Background Worker

The background worker processes jobs for channel processing and caption rechecking:

```bash
# Development (with auto-restart)
npm run worker:dev

# Production
npm run worker
```

**Important**: The background worker must be running for channel processing to work. Without it, jobs will queue but not execute.

## Usage Guide 📖

### 1. Processing a YouTube Channel

1. Navigate to the home page
2. Enter a YouTube channel URL (supports various formats):
   - `https://www.youtube.com/@channelname`
   - `https://www.youtube.com/channel/UC...`
   - `https://www.youtube.com/c/channelname`
   - `https://www.youtube.com/user/username`
3. Select the maximum number of videos to process
4. Click "Start Processing Channel"
5. Monitor the real-time processing status with live progress updates
6. Processing happens in the background - you can close the browser and it will continue

### 2. Managing Your Video Library

1. Navigate to the "Videos" page
2. Browse all processed videos with thumbnails and metadata
3. Filter videos by:
   - Channel ID
   - Caption availability
   - Search terms in title/channel
4. Sort by publishing date, view count, title, etc.
5. Recheck captions for videos that failed initial processing

### 3. Searching Video Content

1. Go to the Search page
2. Enter the channel name (case-insensitive)
3. Enter your search query
4. View results with subtitle fragments and context
5. Use AI features to summarize or ask questions about videos

### 4. AI Features

- **Summarize**: Generate AI-powered summaries of video content
- **Ask Questions**: Get specific answers based on video subtitles
- **Search Suggestions**: Receive AI-generated related search terms

## API Endpoints 🔌

### Channel Processing
- `POST /api/process-channel` - Start processing a YouTube channel (creates background job)
- `GET /api/progress/[jobId]` - Get real-time job progress (Server-Sent Events)

### Video Management
- `GET /api/videos` - List videos with filtering and pagination
- `POST /api/recheck-captions` - Start caption recheck job
- `GET /api/recheck-captions` - Get caption statistics

### Search
- `GET /api/search` - Search video subtitles

### AI Features
- `POST /api/ai/summarize` - Generate video summaries
- `POST /api/ai/qa` - Ask questions about video content

## Database Schema 📊

### Videos Table
```sql
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  channel_name TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_url TEXT UNIQUE NOT NULL,
  upload_date TIMESTAMP NOT NULL,
  subtitles TEXT,
  duration INTEGER,
  view_count INTEGER,
  thumbnail_url TEXT,
  video_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Channels Table
```sql
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  description TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,
  thumbnail_url TEXT,
  last_processed TIMESTAMP,
  is_processing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Development Scripts 🔧

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio

# Setup
npm run setup        # Install deps + setup database
```

## Deployment 🚀

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The application can be deployed on any platform that supports Node.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## Environment Variables Reference 📝

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Troubleshooting 🔧

### Common Issues

1. **YouTube API Quota Exceeded**
   - YouTube API has daily quotas
   - Consider implementing rate limiting
   - Use multiple API keys if needed

2. **Subtitles Not Available**
   - Not all videos have subtitles
   - Auto-generated captions may not be available
   - Check video privacy settings

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Ensure PostgreSQL is running
   - Check firewall settings

4. **OpenAI API Errors**
   - Verify API key is valid
   - Check billing/usage limits
   - Monitor rate limits

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_videos_channel_name ON videos(channel_name);
   CREATE INDEX idx_videos_subtitles ON videos USING gin(to_tsvector('english', subtitles));
   ```

2. **Caching**
   - Implement Redis for API response caching
   - Cache channel processing status
   - Use CDN for static assets

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

## Roadmap 🗺️

- [ ] Video thumbnail processing
- [ ] Advanced search filters
- [ ] User authentication
- [ ] Playlist support
- [ ] Export functionality
- [ ] Webhook notifications
- [ ] Multi-language subtitle support
- [ ] Video sentiment analysis

---

Built with ❤️ using Next.js, PostgreSQL, and OpenAI
