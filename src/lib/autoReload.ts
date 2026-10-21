/**
 * After a new deployment, a page that was already open still references the
 * previous build's files, so navigating fails until the page is reloaded
 * (Chrome: "Loading chunk failed", Safari: "Load failed" / "Importing a module
 * script failed"). Reloading picks up the new build.
 *
 * Reload automatically, but at most once every 30 seconds, so a genuine bug
 * shows the error screen instead of looping.
 */
const KEY = 'uv_auto_reload_at'
const MIN_INTERVAL_MS = 30_000

export function tryAutoReload(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < MIN_INTERVAL_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
