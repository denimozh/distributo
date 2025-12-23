import "./globals.css";

export const metadata = {
  title: 'Distributo | Marketing Automation for Founders',
  description: 'AI-powered marketing automation for Reddit, X, and LinkedIn. Grow your audience on autopilot while you focus on building.',
  keywords: ['marketing automation', 'social media scheduling', 'reddit marketing', 'twitter automation', 'linkedin automation', 'saas marketing', 'indie hackers'],
  authors: [{ name: 'Distributo' }],
  creator: 'Distributo',
  publisher: 'Distributo',
  robots: 'index, follow',
  metadataBase: new URL('https://distributo.io'),
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://distributo.io',
    siteName: 'Distributo',
    title: 'Distributo | Automate Your Marketing. Scale Without the Agency.',
    description: 'AI-powered marketing automation for Reddit, X, and LinkedIn. Grow your audience on autopilot while you focus on building.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Distributo - Marketing Automation for Founders',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Distributo | Automate Your Marketing',
    description: 'AI-powered marketing automation for Reddit, X, and LinkedIn.',
    images: ['/og-image.png'],
    creator: '@distributo_io',
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Manifest
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}