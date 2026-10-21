import Link from 'next/link'

// Honest placeholder for a section that has no real listings yet
export default function NotOpenYet({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-gray-50 min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-3">
        <h1 className="text-2xl font-bold text-[#0F1C3F]">{title}</h1>
        <p className="text-sm text-gray-600">{body}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/investments" className="px-5 py-2.5 rounded-xl border border-[#0F1C3F] text-[#0F1C3F] text-sm font-bold">
            Open investments
          </Link>
          <Link href="/contact" className="px-5 py-2.5 rounded-xl bg-[#0F1C3F] text-white text-sm font-bold">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}
