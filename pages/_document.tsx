import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="description" content="Search YouTube video subtitles with AI-powered insights" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Video Memory - YouTube Subtitle Search" />
        <meta property="og:description" content="Search YouTube video subtitles with AI-powered insights" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Video Memory - YouTube Subtitle Search" />
        <meta property="twitter:description" content="Search YouTube video subtitles with AI-powered insights" />
        <meta property="twitter:image" content="/og-image.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

