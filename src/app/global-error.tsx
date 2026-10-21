'use client'

import { useEffect } from 'react'
import { tryAutoReload } from '@/lib/autoReload'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Usually a page left open across a new deployment: reloading fixes it
    if (tryAutoReload()) return
    console.error('Application error:', error)
  }, [error])

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    } else {
      reset()
    }
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0F1C3F' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '420px', width: '100%', backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#0F1C3F' }}>Union Verify</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Something went wrong while loading this page. Reloading usually fixes it.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleReload}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: '#0F1C3F', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Reload
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/'
                  }
                }}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
