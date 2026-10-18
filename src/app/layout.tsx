import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
