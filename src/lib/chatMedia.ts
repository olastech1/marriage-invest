/** Photos and videos in chat: sizes, limits and file type checks (shared by the upload and chat routes) */

/** Each stored piece; well under the ~4.5 MB a single request or response may carry */
export const MEDIA_PART_SIZE = 3 * 1024 * 1024
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024
/** What one member may upload in 24 hours */
export const DAILY_MEDIA_BYTES = 300 * 1024 * 1024

export type MediaKind = 'image' | 'video'

/** The video type from a file's first bytes (never trust the browser's label) */
export function videoType(bytes: Uint8Array): 'video/mp4' | 'video/quicktime' | 'video/webm' | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(4, 8) === 'ftyp') return ascii(8, 12) === 'qt  ' ? 'video/quicktime' : 'video/mp4'
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'video/webm'
  return null
}

/** The expected length of one piece of a file */
export function partLength(size: number, index: number, partSize = MEDIA_PART_SIZE) {
  return Math.min(partSize, size - index * partSize)
}
