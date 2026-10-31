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
    default: 'Union Verify — Invest, Save and Grow',
    template: '%s | Union Verify',
  },
  description:
    'A joint savings and investment platform for couples. Explore opportunities, manage your portfolio, and track your investments.',
  keywords: ['investment', 'USD investment platform', 'portfolio', 'joint savings', 'couples savings', 'portfolio', 'USD investment', 'Union Verify'],
  openGraph: {
    title: 'Union Verify — Invest, Save and Grow',
    description: 'A joint savings and investment platform for couples.',
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
                // A page left open across a deployment can't load the new build's files.
                // Reload (at most every 30s) for Chrome, Safari and Firefox wordings.
                var stale = /loading (css )?chunk|chunkloaderror|dynamically imported module|importing a module script failed|load failed|error loading dynamically/i;
                function reloadOnce(message) {
                  if (!stale.test(message || '')) return;
                  try {
                    var last = Number(sessionStorage.getItem('uv_auto_reload_at') || 0);
                    if (Date.now() - last < 30000) return;
                    sessionStorage.setItem('uv_auto_reload_at', String(Date.now()));
                  } catch (e) { return; }
                  window.location.reload();
                }
                window.addEventListener('error', function(e) { reloadOnce(e && e.message); });
                window.addEventListener('unhandledrejection', function(e) {
                  var r = e && e.reason;
                  reloadOnce(r && (r.message || String(r)));
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
