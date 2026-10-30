'use client'

import { useState } from 'react'

export const initialsOf = (name?: string | null) =>
  (name || 'UV').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()

/** A member's profile photo, or their initials when they have none */
export default function UserAvatar({
  name,
  src,
  className = 'w-10 h-10 text-xs',
  fallbackClassName = 'bg-[#0F1C3F] text-[#C9A84C]',
}: {
  name?: string | null
  src?: string | null
  /** Size and text size */
  className?: string
  /** Colours of the initials circle */
  fallbackClassName?: string
}) {
  const [failed, setFailed] = useState('')

  if (src && failed !== src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small photo from our own API
      <img
        src={src}
        alt={name ? `${name}'s photo` : ''}
        onError={() => setFailed(src)}
        className={`rounded-full object-cover flex-shrink-0 bg-gray-100 ${className}`}
      />
    )
  }
  return (
    <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${fallbackClassName} ${className}`}>
      {initialsOf(name)}
    </div>
  )
}
