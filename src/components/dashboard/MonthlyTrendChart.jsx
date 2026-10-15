import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import GlassCard from '../ui/GlassCard'
import EmptyState from '../ui/EmptyState'
import { BarChart3 } from 'lucide-react'

const formatCurrency = (amount) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toString()
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-slate-100">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="text-sm text-slate-600">{item.name}:</span>
            <span className="text-sm font-semibold text-slate-900">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR',
                minimumFractionDigits: 0, maximumFractionDigits: 0,
              }).format(item.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function MonthlyTrendChart({ transactions }) {
  const data = useMemo(() => {
    const now = new Date()
    const months = []

    // Build last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push({
        key,
        name: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`,
        income: 0,
        expense: 0,
      })
    }

    // Aggregate transactions
    transactions.forEach(t => {
      const d = new Date(t.transaction_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const month = months.find(m => m.key === key)
      if (month) {
        if (t.type === 'income') {
          month.income += parseFloat(t.amount) || 0
        } else if (t.type === 'expense') {
          month.expense += parseFloat(t.amount) || 0
        }
      }
    })

    return months
  }, [transactions])

  const hasData = data.some(d => d.income > 0 || d.expense > 0)

  return (
    <GlassCard className="p-6 animate-fade-in stagger-3">
      <h3 className="text-base font-bold text-slate-900 mb-6">Monthly Overview</h3>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Your monthly trends will appear here"
        />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={data} barGap={4} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#1E293B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  )
}
