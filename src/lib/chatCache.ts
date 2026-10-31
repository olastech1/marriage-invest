/**
 * A copy of the chat list and recent messages kept on this device, so chats
 * open straight away while the latest is fetched. Cleared on sign-out.
 */

const PREFIX = 'uv-chat:'

export function readChatCache<T>(userId: string, what: string): T | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${PREFIX}${userId}:${what}`)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeChatCache(userId: string, what: string, value: unknown) {
  if (!userId) return
  try {
    localStorage.setItem(`${PREFIX}${userId}:${what}`, JSON.stringify(value))
  } catch {
    // Storage full or blocked: chats still work, just without the copy
  }
}

export function clearChatCache() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX)) localStorage.removeItem(key)
  } catch {
    // Nothing to clear
  }
}
