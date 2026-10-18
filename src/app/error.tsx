'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Check if this error was caused by a stale deployment chunk or failed fetch
    const msg = error?.message?.toLowerCase() || ''
    const isChunkError =
      msg.includes('chunk') ||
      msg.includes('loading') ||
      msg.includes('failed to fetch') ||
      msg.includes('dynamically imported module')

    if (isChunkError && typeof window !== 'undefined') {
      const hasAutoReloaded = sessionStorage.getItem('chunk_reload_attempted')
      if (!hasAutoReloaded) {
        sessionStorage.setItem('chunk_reload_attempted', 'true')
        window.location.reload()
        return
      }
    }

    console.error('Root application error boundary caught:', error)
  }, [error])

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk_reload_attempted')
      window.location.reload()
    } else {
      reset()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            Union Verify
          </div>
          <h1 className="text-2xl font-black text-[#0F1C3F]">Temporary Navigation Notice</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page encountered a brief transition update. A quick refresh will load the latest verified state.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleReload}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0F1C3F] text-white font-bold text-xs hover:bg-[#1a2f64] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} />
            Reload Page
          </button>
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('chunk_reload_attempted')
              }
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Home size={14} />
            Go to Home
          </Link>
        </div>

        {error?.digest && (
          <p className="text-[10px] text-slate-400 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
