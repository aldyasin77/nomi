import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BudgetProgressBar({ categoryName, spent, limit, percentage, status, onClick }) {
  const { emoji, name: cleanName } = extractCategoryEmojiAndName(categoryName)
  const statusColors = {
    safe: {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    warning: {
      bar: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    danger: {
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
  }

  const colors = statusColors[status] || statusColors.safe
  const remaining = limit - spent

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="space-y-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors p-2.5 -mx-2.5 rounded-xl select-none group"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          <span className="text-base">{emoji}</span>
          <span>{cleanName}</span>
        </span>
        <span className={`text-xs font-semibold ${colors.text}`}>
          {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {formatCurrency(spent)} of {formatCurrency(limit)}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
