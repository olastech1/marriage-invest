'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LineDataPoint {
  month: string
  total: number
}

interface PieDataPoint {
  name: string
  value: number
}

interface AdminDashboardChartsProps {
  lineData: LineDataPoint[]
  pieData: PieDataPoint[]
}

export default function AdminDashboardCharts({
  lineData,
  pieData,
}: AdminDashboardChartsProps) {
  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 1000000) return `$${(tickItem / 1000000).toFixed(1)}M`
    if (tickItem >= 1000) return `$${(tickItem / 1000).toFixed(0)}k`
    return `$${tickItem}`
  }

  const formatTooltip = (value: number | string | undefined) => {
    if (value === undefined) return '$0'
    const num = typeof value === 'number' ? value : Number(value)
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      <div className="h-64 w-full">
        {lineData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            No transaction data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={(value: any) => [`$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Total']}
                labelStyle={{ fontWeight: 600, color: '#0F1C3F' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#C9A84C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {pieData.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Active Fund Distribution
          </p>
          <div className="space-y-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate max-w-[200px]">{item.name}</span>
                <span className="font-semibold text-gray-900">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
