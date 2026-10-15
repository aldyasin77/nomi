import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BudgetProgressBar({ categoryName, spent, limit, percentage, status }) {
  const { emoji, name: cleanName } = extractCategoryEmojiAndName(categoryName)
  const statusColors = {
    safe: {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    warning: {
      bar: 'bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    danger: {
      bar: 'bg-rose-500',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  }

  const colors = statusColors[status] || statusColors.safe
  const remaining = limit - spent

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span>{cleanName}</span>
        </span>
        <span className={`text-xs font-semibold ${colors.text}`}>
          {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {formatCurrency(spent)} of {formatCurrency(limit)}
        </span>
        <span className="text-xs text-slate-400">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
