'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  PiggyBank,
  Target,
  Plus,
  TrendingUp,
  Sparkles,
  Users,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Heart,
  Calendar,
  DollarSign,
  ShieldCheck,
  Clock,
  ArrowRight,
  Coins,
  Smile,
  Sliders,
  Check,
} from 'lucide-react'

interface SavingsGoal {
  id: string
  title: string
  category: string
  targetAmount: number
  partner1Saved: number
  partner2Saved: number
  targetDate: string
  monthlyAutoSave: number
  apy: number
  isCompleted?: boolean
}

interface SavingsActivity {
  id: string
  contributor: string
  goalTitle: string
  amount: number
  date: string
  memo: string
  type: 'DEPOSIT' | 'YIELD'
}

export default function MarriageSavingsPage() {
  const { data: session } = useSession()
  const partner1Name = session?.user?.name || 'Jane Doe'
  const [partner2Name, setPartner2Name] = useState('Marcus Vance')

  // Initial joint goals
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: 'g1',
      title: 'Family Dream Home Down Payment',
      category: 'Real Estate',
      targetAmount: 50000,
      partner1Saved: 11400,
      partner2Saved: 10600,
      targetDate: 'Dec 2027',
      monthlyAutoSave: 600,
      apy: 6.8,
    },
    {
      id: 'g2',
      title: 'First Baby & Education Nest Egg',
      category: 'Family Legacy',
      targetAmount: 20000,
      partner1Saved: 4200,
      partner2Saved: 3800,
      targetDate: 'Jun 2028',
      monthlyAutoSave: 400,
      apy: 6.8,
    },
    {
      id: 'g3',
      title: '10-Year Anniversary Trip (Amalfi Coast)',
      category: 'Travel & Celebration',
      targetAmount: 10000,
      partner1Saved: 3750,
      partner2Saved: 3450,
      targetDate: 'Sep 2026',
      monthlyAutoSave: 500,
      apy: 6.8,
    },
    {
      id: 'g4',
      title: 'Joint Emergency Liquid Reserve',
      category: 'Safety Buffer',
      targetAmount: 15000,
      partner1Saved: 7500,
      partner2Saved: 7500,
      targetDate: 'Achieved 🎉',
      monthlyAutoSave: 0,
      apy: 6.8,
      isCompleted: true,
    },
  ])

  // Joint activity ledger
  const [activities, setActivities] = useState<SavingsActivity[]>([
    {
      id: 'a1',
      contributor: 'Jane Doe',
      goalTitle: 'Family Dream Home Down Payment',
      amount: 400,
      date: 'Today, 2:15 PM',
      memo: 'From my Q3 consulting bonus ❤️',
      type: 'DEPOSIT',
    },
    {
      id: 'a2',
      contributor: 'Marcus Vance',
      goalTitle: 'Family Dream Home Down Payment',
      amount: 400,
      date: 'Yesterday, 6:30 PM',
      memo: 'Matched your deposit! 🏡',
      type: 'DEPOSIT',
    },
    {
      id: 'a3',
      contributor: 'Union Vault Yield',
      goalTitle: 'All Goals Combined',
      amount: 148.5,
      date: 'Oct 01, 2026',
      memo: '6.8% APY Monthly compounding interest',
      type: 'YIELD',
    },
    {
      id: 'a4',
      contributor: 'Marcus Vance',
      goalTitle: '10-Year Anniversary Trip (Amalfi Coast)',
      amount: 250,
      date: 'Sep 28, 2026',
      memo: 'Flight tickets fund! ✈️',
      type: 'DEPOSIT',
    },
    {
      id: 'a5',
      contributor: 'Jane Doe',
      goalTitle: 'First Baby & Education Nest Egg',
      amount: 200,
      date: 'Sep 22, 2026',
      memo: 'Bi-weekly auto-deposit',
      type: 'DEPOSIT',
    },
  ])

  // Filter state
  const [filterContributor, setFilterContributor] = useState<'ALL' | 'PARTNER1' | 'PARTNER2' | 'YIELD'>('ALL')

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string>('g1')
  const [depositAmount, setDepositAmount] = useState<string>('250')
  const [contributorMode, setContributorMode] = useState<'PARTNER1' | 'PARTNER2' | 'SPLIT'>('SPLIT')
  const [depositMemo, setDepositMemo] = useState<string>('Joint savings contribution ❤️')
  const [depositProcessing, setDepositProcessing] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // New Goal Modal state
  const [showNewGoalModal, setShowNewGoalModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Home & Living')
  const [newTarget, setNewTarget] = useState('12000')
  const [newTargetDate, setNewTargetDate] = useState('Dec 2027')
  const [newInitialDeposit, setNewInitialDeposit] = useState('500')

  // Calculator state
  const [calcMonthlyPerPartner, setCalcMonthlyPerPartner] = useState(400)
  const [calcYears, setCalcYears] = useState(5)

  // Computed Totals
  const totalPartner1 = goals.reduce((acc, g) => acc + g.partner1Saved, 0)
  const totalPartner2 = goals.reduce((acc, g) => acc + g.partner2Saved, 0)
  const totalJointSaved = totalPartner1 + totalPartner2
  const totalTargetAmount = goals.reduce((acc, g) => acc + g.targetAmount, 0)
  const partner1Pct = totalJointSaved > 0 ? Math.round((totalPartner1 / totalJointSaved) * 100) : 50
  const partner2Pct = 100 - partner1Pct

  // Handle Deposit
  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) return

    setDepositProcessing(true)

    setTimeout(() => {
      let p1Add = 0
      let p2Add = 0
      let actorName = ''

      if (contributorMode === 'SPLIT') {
        p1Add = amt / 2
        p2Add = amt / 2
        actorName = `${partner1Name} & ${partner2Name} (50/50)`
      } else if (contributorMode === 'PARTNER1') {
        p1Add = amt
        actorName = partner1Name
      } else {
        p2Add = amt
        actorName = partner2Name
      }

      setGoals((prev) =>
        prev.map((g) => {
          if (g.id === selectedGoalId) {
            return {
              ...g,
              partner1Saved: g.partner1Saved + p1Add,
              partner2Saved: g.partner2Saved + p2Add,
            }
          }
          return g
        })
      )

      const targetGoal = goals.find((g) => g.id === selectedGoalId)
      const newAct: SavingsActivity = {
        id: `a-${Date.now()}`,
        contributor: actorName,
        goalTitle: targetGoal ? targetGoal.title : 'Joint Vault',
        amount: amt,
        date: 'Just now',
        memo: depositMemo || 'Joint savings deposit',
        type: 'DEPOSIT',
      }

      setActivities((prev) => [newAct, ...prev])
      setDepositProcessing(false)
      setShowDepositModal(false)
      setSuccessToast(`Successfully added $${amt.toLocaleString()} to ${targetGoal?.title}!`)
      setTimeout(() => setSuccessToast(null), 4000)
    }, 700)
  }

  // Handle Create New Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(newTarget)
    const init = parseFloat(newInitialDeposit) || 0
    if (!newTitle.trim() || isNaN(target) || target <= 0) return

    const newGoal: SavingsGoal = {
      id: `g-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetAmount: target,
      partner1Saved: init / 2,
      partner2Saved: init / 2,
      targetDate: newTargetDate,
      monthlyAutoSave: Math.round(target / 24),
      apy: 6.8,
    }

    setGoals((prev) => [newGoal, ...prev])
    setShowNewGoalModal(false)
    setNewTitle('')
    setSuccessToast(`New joint goal "${newGoal.title}" created successfully!`)
    setTimeout(() => setSuccessToast(null), 4000)
  }

  // Compound Calculator Math
  const totalMonths = calcYears * 12
  const monthlyDepositTotal = calcMonthlyPerPartner * 2
  const r = 0.068 / 12
  let futureValue = 0
  for (let i = 0; i < totalMonths; i++) {
    futureValue = (futureValue + monthlyDepositTotal) * (1 + r)
  }
  const totalPrincipal = monthlyDepositTotal * totalMonths
  const totalInterestEarned = Math.max(0, futureValue - totalPrincipal)

  // Filtered activities
  const filteredActivities = activities.filter((act) => {
    if (filterContributor === 'ALL') return true
    if (filterContributor === 'YIELD') return act.type === 'YIELD'
    if (filterContributor === 'PARTNER1') return act.contributor.includes(partner1Name)
    if (filterContributor === 'PARTNER2') return act.contributor.includes(partner2Name)
    return true
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#C9A84C]" />
            Dual-Partner Joint Savings Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1C3F]">
            Marriage Savings & Shared Goals
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Save together with your partner toward life milestones. Both spouses can deposit funds, track equal 50/50 contributions, and earn <strong>6.8% APY</strong> compound interest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-gray-500" />
            New Goal
          </button>
          <button
            onClick={() => {
              setSelectedGoalId(goals[0]?.id || 'g1')
              setShowDepositModal(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] text-[#0F1C3F] font-bold text-xs sm:text-sm hover:bg-[#d4b460] transition-colors shadow-md shadow-[#C9A84C]/25"
          >
            <PiggyBank className="w-4 h-4 text-[#0F1C3F]" />
            Deposit to Vault
          </button>
        </div>
      </div>

      {/* ── SUCCESS TOAST NOTIFICATION ── */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── HIGH-LEVEL JOINT WEALTH STATS BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Joint Balance */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0F1C3F] to-[#1c3269] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PiggyBank className="w-24 h-24 text-white" />
          </div>
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
            Total Combined Savings
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            ${totalJointSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1 font-bold text-[#C9A84C]">
              <TrendingUp className="w-3.5 h-3.5" /> 6.8% APY
            </span>
            <span>· Paid Monthly</span>
          </div>
        </div>

        {/* Partner 1 Contribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {partner1Name}
              </span>
              <span className="text-xs font-bold text-indigo-600 px-2 py-0.5 rounded-full bg-indigo-50">
                {partner1Pct}% share
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C3F]">
              ${totalPartner1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Primary Spouse Contributions
          </p>
        </div>

        {/* Partner 2 Contribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {partner2Name}
              </span>
              <span className="text-xs font-bold text-amber-600 px-2 py-0.5 rounded-full bg-amber-50">
                {partner2Pct}% share
              </span>
            </div>
            <div className="text-2xl font-bold text-[#0F1C3F]">
              ${totalPartner2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Joint Spouse Contributions
          </p>
        </div>

        {/* High-Yield Interest Earned */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Interest Yield Earned
              </span>
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                ✨
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              +$842.50
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Automatic compounding monthly
          </p>
        </div>
      </div>

      {/* ── PARTNER SAVINGS EQUALITY BAR ── */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-gray-800">{partner1Name}: ${totalPartner1.toLocaleString()} ({partner1Pct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-800">{partner2Name}: ${totalPartner2.toLocaleString()} ({partner2Pct}%)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
          </div>
        </div>

        {/* Split progress bar */}
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${partner1Pct}%` }}
            title={`${partner1Name}: ${partner1Pct}%`}
          />
          <div
            className="bg-[#C9A84C] h-full transition-all duration-500"
            style={{ width: `${partner2Pct}%` }}
            title={`${partner2Name}: ${partner2Pct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span>Mutual financial harmony metric</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Both Partners Actively Contributing
          </span>
        </div>
      </div>

      {/* ── JOINT SAVINGS GOALS CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F1C3F]">Active Marital Goals</h2>
            <p className="text-xs text-gray-500">Milestone funds governed under your joint beneficial covenant.</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {goals.length} Active Vaults
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const currentTotal = goal.partner1Saved + goal.partner2Saved
            const progressPct = Math.min(100, Math.round((currentTotal / goal.targetAmount) * 100))
            const p1Share = currentTotal > 0 ? Math.round((goal.partner1Saved / currentTotal) * 100) : 50
            const p2Share = 100 - p1Share

            return (
              <div
                key={goal.id}
                className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#C9A84C]/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                      {goal.category}
                    </span>
                    {goal.isCompleted ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Fully Funded
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Target: {goal.targetDate}
                      </span>
                    )}
                  </div>

                  {/* Title & Target */}
                  <h3 className="text-lg font-bold text-[#0F1C3F] leading-snug mb-1">
                    {goal.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-extrabold text-[#0F1C3F]">
                      ${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-gray-400">
                      of ${goal.targetAmount.toLocaleString()} target
                    </span>
                    <span className="ml-auto font-bold text-xs text-[#C9A84C]">
                      {progressPct}%
                    </span>
                  </div>

                  {/* Visual dual-split progress bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full transition-all"
                        style={{ width: `${(goal.partner1Saved / goal.targetAmount) * 100}%` }}
                        title={`${partner1Name}: $${goal.partner1Saved.toLocaleString()}`}
                      />
                      <div
                        className="bg-[#C9A84C] h-full transition-all"
                        style={{ width: `${(goal.partner2Saved / goal.targetAmount) * 100}%` }}
                        title={`${partner2Name}: $${goal.partner2Saved.toLocaleString()}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{partner1Name}: ${goal.partner1Saved.toLocaleString()}</span>
                      <span>{partner2Name}: ${goal.partner2Saved.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Vault terms */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 text-xs mb-4">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Auto-Save</span>
                      <span className="font-semibold text-gray-800">
                        {goal.monthlyAutoSave > 0 ? `$${goal.monthlyAutoSave}/month` : 'Manual Deposits'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Yield APY</span>
                      <span className="font-semibold text-emerald-600">
                        {goal.apy}% Compound
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedGoalId(goal.id)
                      setShowDepositModal(true)
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F1C3F] hover:bg-[#1c3269] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C9A84C]" />
                    Deposit to Goal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── COMPOUND GROWTH CALCULATOR FOR COUPLES ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Exponential Compound Growth
            </div>
            <h3 className="text-xl font-bold text-[#0F1C3F]">
              How Fast Your Joint Savings Grow Together
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Calculate projected returns at our fixed 6.8% APY high-yield marital vault rate.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 text-xs font-bold">
            {[1, 3, 5, 10].map((yr) => (
              <button
                key={yr}
                onClick={() => setCalcYears(yr)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  calcYears === yr ? 'bg-white text-[#0F1C3F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {yr} {yr === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>

        {/* Slider & Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Monthly Deposit Per Partner
                </label>
                <span className="text-base font-bold text-[#0F1C3F]">
                  ${calcMonthlyPerPartner.toLocaleString()} / mo each
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2500"
                step="50"
                value={calcMonthlyPerPartner}
                onChange={(e) => setCalcMonthlyPerPartner(Number(e.target.value))}
                className="w-full accent-[#C9A84C] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>$50/mo</span>
                <span>Combined: ${(calcMonthlyPerPartner * 2).toLocaleString()}/month</span>
                <span>$2,500/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 text-center">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  {partner1Name}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  ${(calcMonthlyPerPartner * totalMonths).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  {partner2Name}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  ${(calcMonthlyPerPartner * totalMonths).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                  6.8% Compound Yield
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  +${Math.round(totalInterestEarned).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#0F1C3F] to-[#1e326b] text-white text-center shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70 block mb-1">
              Projected Joint Matrimonial Wealth in {calcYears} {calcYears === 1 ? 'Year' : 'Years'}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#C9A84C] tracking-tight my-2">
              ${Math.round(futureValue).toLocaleString()}
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Includes ${Math.round(totalInterestEarned).toLocaleString()} pure interest yield earned completely passive while saving together.
            </p>
          </div>
        </div>
      </div>

      {/* ── JOINT SAVINGS ACTIVITY LEDGER ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F1C3F]">Recent Joint Savings Activity</h3>
            <p className="text-xs text-gray-500">Live ledger of deposits and monthly interest yield credits.</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 text-xs font-semibold">
            <button
              onClick={() => setFilterContributor('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterContributor === 'ALL' ? 'bg-white text-[#0F1C3F] shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterContributor('PARTNER1')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterContributor === 'PARTNER1' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {partner1Name.split(' ')[0]}
            </button>
            <button
              onClick={() => setFilterContributor('PARTNER2')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterContributor === 'PARTNER2' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {partner2Name.split(' ')[0]}
            </button>
            <button
              onClick={() => setFilterContributor('YIELD')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterContributor === 'YIELD' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yield
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredActivities.map((act) => (
            <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  act.type === 'YIELD'
                    ? 'bg-emerald-100 text-emerald-700'
                    : act.contributor.includes(partner1Name)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {act.type === 'YIELD' ? '📈' : act.contributor[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">{act.contributor}</span>
                    <span className="text-[10px] text-gray-400 font-medium">· {act.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{act.goalTitle}</p>
                  {act.memo && (
                    <p className="text-[11px] text-gray-400 italic mt-0.5 truncate">&ldquo;{act.memo}&rdquo;</p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold text-emerald-600 block">
                  +${act.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {act.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEPOSIT MODAL ── */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Deposit to Marriage Savings</h3>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteDeposit} className="space-y-4">
              {/* Target Goal Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Select Goal to Fund
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} (${(g.partner1Saved + g.partner2Saved).toLocaleString()} / ${g.targetAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Who is Depositing? */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Who is Contributing?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setContributorMode('SPLIT')}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                      contributorMode === 'SPLIT'
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#0F1C3F] ring-1 ring-[#C9A84C]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    50/50 Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributorMode('PARTNER1')}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                      contributorMode === 'PARTNER1'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {partner1Name.split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributorMode('PARTNER2')}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition-all ${
                      contributorMode === 'PARTNER2'
                        ? 'border-amber-600 bg-amber-50 text-amber-700 ring-1 ring-amber-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {partner2Name.split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* Amount Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Deposit Amount (USD)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['50', '100', '250', '500'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        depositAmount === preset
                          ? 'bg-[#0F1C3F] text-white border-[#0F1C3F]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>

              {/* Love Note / Memo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Note for Your Partner (Optional)
                </label>
                <input
                  type="text"
                  value={depositMemo}
                  onChange={(e) => setDepositMemo(e.target.value)}
                  placeholder="e.g., Friday paycheck savings! ❤️"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <button
                type="submit"
                disabled={depositProcessing}
                className="w-full py-3.5 rounded-xl bg-[#C9A84C] hover:bg-[#d4b460] text-[#0F1C3F] font-bold text-sm tracking-wide transition-all shadow-md shadow-[#C9A84C]/25 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {depositProcessing ? 'Depositing to Vault...' : `Confirm $${depositAmount} Savings Deposit`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE NEW GOAL MODAL ── */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-[#0F1C3F]">Create Shared Marriage Goal</h3>
              </div>
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Family SUV, New Kitchen"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Family Legacy">Family Legacy</option>
                    <option value="Travel & Celebration">Travel & Celebration</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Safety Buffer">Safety Buffer</option>
                    <option value="Custom Project">Custom Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dec 2027"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Target Goal ($)
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Initial Deposit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialDeposit}
                    onChange={(e) => setNewInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0F1C3F] hover:bg-[#1c3269] text-white font-bold text-sm tracking-wide transition-all shadow-md mt-4"
              >
                Create Shared Goal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
