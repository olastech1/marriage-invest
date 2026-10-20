import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Keyboard resizes the layout instead of overlaying/zooming it on mobile
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: {
    default: 'Union Verify — Marriage Investment Platform',
    template: '%s | Union Verify',
  },
  description:
    'A secure, transparent marriage investment platform. Explore opportunities, manage your portfolio, and track your investments with confidence.',
  keywords: ['investment', 'marriage investment', 'portfolio', 'USD investment', 'Union Verify'],
  openGraph: {
    title: 'Union Verify — Marriage Investment Platform',
    description: 'A secure, transparent marriage investment platform.',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

import AuthProvider from '@/components/providers/AuthProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('error', function(e) {
                  var msg = (e && e.message) ? e.message.toLowerCase() : '';
                  if (msg.indexOf('loading chunk') !== -1 || msg.indexOf('failed to fetch dynamically imported module') !== -1) {
                    var key = 'chunk_reload_lock';
                    if (!sessionStorage.getItem(key)) {
                      sessionStorage.setItem(key, '1');
                      window.location.reload();
                    }
                  }
                });
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    sessionStorage.removeItem('chunk_reload_lock');
                  }, 1000);
                });
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
