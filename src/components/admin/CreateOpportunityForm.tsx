'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, AlertCircle, X } from 'lucide-react'

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] text-sm text-gray-900 bg-white'
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5'

const EMPTY = {
  title: '',
  shortDescription: '',
  description: '',
  minAmount: '',
  maxAmount: '',
  targetAmount: '',
  termMonths: '',
  annualReturnPercent: '',
  distributionType: 'MONTHLY',
  riskLevel: 'MEDIUM',
  status: 'DRAFT',
  openDate: '',
  closeDate: '',
}

export default function CreateOpportunityForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          shortDescription: form.shortDescription,
          description: form.description,
          minAmount: Number(form.minAmount),
          maxAmount: form.maxAmount ? Number(form.maxAmount) : null,
          targetAmount: Number(form.targetAmount),
          termMonths: Number(form.termMonths),
          annualReturnPercent: Number(form.annualReturnPercent),
          distributionType: form.distributionType,
          riskLevel: form.riskLevel,
          status: form.status,
          openDate: form.openDate,
          closeDate: form.closeDate,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not create the opportunity.')
        return
      }
      setForm(EMPTY)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F1C3F] text-white text-sm font-semibold hover:bg-[#1a2c5e] transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4 text-[#C9A84C]" />
        New Opportunity
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">New Investment Opportunity</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Title</label>
          <input required value={form.title} onChange={set('title')} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Short summary (shown on cards)</label>
          <input required value={form.shortDescription} onChange={set('shortDescription')} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Full description</label>
          <textarea required rows={4} value={form.description} onChange={set('description')} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Minimum investment (USD)</label>
          <input required type="number" min="0" step="0.01" value={form.minAmount} onChange={set('minAmount')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Maximum per investor (USD, optional)</label>
          <input type="number" min="0" step="0.01" value={form.maxAmount} onChange={set('maxAmount')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Funding target (USD)</label>
          <input required type="number" min="0" step="0.01" value={form.targetAmount} onChange={set('targetAmount')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Term (months)</label>
          <input required type="number" min="1" max="360" step="1" value={form.termMonths} onChange={set('termMonths')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Projected annual return (% per year, not guaranteed)</label>
          <input required type="number" min="0" max="100" step="0.01" value={form.annualReturnPercent} onChange={set('annualReturnPercent')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Distributions</label>
          <select value={form.distributionType} onChange={set('distributionType')} className={inputClass}>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
            <option value="AT_MATURITY">At maturity</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Risk level</label>
          <select value={form.riskLevel} onChange={set('riskLevel')} className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={set('status')} className={inputClass}>
            <option value="DRAFT">Draft (hidden from members)</option>
            <option value="ACTIVE">Active (members can invest)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Open date (optional)</label>
          <input type="date" value={form.openDate} onChange={set('openDate')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Close date (optional)</label>
          <input type="date" value={form.closeDate} onChange={set('closeDate')} className={inputClass} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F1C3F] text-white text-sm font-semibold hover:bg-[#1a2c5e] disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin text-[#C9A84C]" /> : <Plus className="w-4 h-4 text-[#C9A84C]" />}
          {saving ? 'Creating...' : 'Create Opportunity'}
        </button>
      </div>
    </form>
  )
}
