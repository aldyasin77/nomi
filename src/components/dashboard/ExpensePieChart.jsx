import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import GlassCard from '../ui/GlassCard'
import EmptyState from '../ui/EmptyState'
import { PieChart as PieIcon } from 'lucide-react'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const COLORS = [
  '#1E293B', '#312E81', '#06B6D4', '#0EA5E9',
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#6366F1', '#EF4444',
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{data.name}</p>
        <p className="text-sm text-slate-600">{formatCurrency(data.value)}</p>
        <p className="text-xs text-slate-400">{(data.payload.percentage).toFixed(1)}%</p>
      </div>
    )
  }
  return null
}

export default function ExpensePieChart({ transactions }) {
  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Uncategorized'
      acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.amount)
      return acc
    }, {})

  const total = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)

  const data = Object.entries(expensesByCategory)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <GlassCard className="p-6 animate-fade-in stagger-2">
      <h3 className="text-base font-bold text-slate-900 mb-6">Expenses by Category</h3>
      
      {data.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title="No expenses yet"
          description="Your expense breakdown will appear here"
        />
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Chart */}
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3 w-full">
            {data.slice(0, 5).map((item, index) => {
              const { emoji, name: cleanName } = extractCategoryEmojiAndName(item.name)
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{emoji}</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{cleanName}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 ml-2 shrink-0">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
