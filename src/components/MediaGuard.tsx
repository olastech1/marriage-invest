'use client'

import { useEffect } from 'react'

/** Members' photos and videos (served from /api/chat/media) */
const isMemberMedia = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'IMG' || el.tagName === 'VIDEO') && /\/api\/chat\/media\//.test((el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src || '')

/**
 * View only: members' photos and videos can't be saved from the page with the
 * usual right-click / long-press "Save", or dragged out. (Screenshots and screen
 * recordings can't be stopped by any website.)
 */
export default function MediaGuard() {
  useEffect(() => {
    const block = (e: Event) => {
      if (isMemberMedia(e.target)) e.preventDefault()
    }
    document.addEventListener('contextmenu', block, true)
    document.addEventListener('dragstart', block, true)
    return () => {
      document.removeEventListener('contextmenu', block, true)
      document.removeEventListener('dragstart', block, true)
    }
  }, [])
  return null
}
