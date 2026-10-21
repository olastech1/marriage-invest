import { AlertCircle } from 'lucide-react'

/** Shown when an admin page could not read from the database, so empty lists are not mistaken for real zeros. */
export default function LoadErrorBanner() {
  return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
      <span>Could not load data from the database. The figures below are incomplete. Refresh to try again.</span>
    </div>
  )
}
