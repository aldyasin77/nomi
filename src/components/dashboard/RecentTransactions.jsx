import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt,
  Utensils,
  Car,
  Home,
  Film,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Tag,
  ChevronRight,
} from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import EmptyState from '../ui/EmptyState'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCategoryIcon(name, type) {
  if (type === 'transfer') return { icon: ArrowLeftRight, bg: 'bg-indigo-50', color: 'text-indigo-600' }
  const lower = (name || '').toLowerCase()
  if (lower.includes('food') || lower.includes('dining') || lower.includes('makan') || lower.includes('coffee')) {
    return { icon: Utensils, bg: 'bg-emerald-50 text-emerald-600', color: 'text-emerald-600' }
  }
  if (lower.includes('transport') || lower.includes('grab') || lower.includes('gojek') || lower.includes('bensin')) {
    return { icon: Car, bg: 'bg-blue-50 text-blue-600', color: 'text-blue-600' }
  }
  if (lower.includes('house') || lower.includes('housing') || lower.includes('utilit') || lower.includes('listrik')) {
    return { icon: Home, bg: 'bg-amber-50 text-amber-600', color: 'text-amber-600' }
  }
  if (lower.includes('entertain') || lower.includes('cinema') || lower.includes('game') || lower.includes('netflix')) {
    return { icon: Film, bg: 'bg-rose-50 text-rose-600', color: 'text-rose-600' }
  }
  if (lower.includes('shop') || lower.includes('grocer') || lower.includes('belanja')) {
    return { icon: ShoppingBag, bg: 'bg-purple-50 text-purple-600', color: 'text-purple-600' }
  }
  if (lower.includes('salary') || lower.includes('gaji') || lower.includes('income')) {
    return { icon: Briefcase, bg: 'bg-emerald-50 text-emerald-600', color: 'text-emerald-600' }
  }
  if (lower.includes('interest') || lower.includes('bunga') || lower.includes('invest')) {
    return { icon: TrendingUp, bg: 'bg-cyan-50 text-cyan-600', color: 'text-cyan-600' }
  }
  return type === 'income'
    ? { icon: ArrowDownLeft, bg: 'bg-emerald-50 text-emerald-600', color: 'text-emerald-600' }
    : { icon: ArrowUpRight, bg: 'bg-rose-50 text-rose-600', color: 'text-rose-600' }
}

export default function RecentTransactions({
  transactions = [],
  title = 'Recent Transactions',
  showViewAll = true,
  className = '',
}) {
  return (
    <GlassCard className={`p-6 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        {showViewAll && (
          <Link
            to="/transactions"
            className="text-xs font-semibold text-[#1A2C4C] hover:text-[#312E81] flex items-center gap-0.5 group transition-colors"
          >
            <span>View All</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions"
          description="Add your first transaction to see it here"
        />
      ) : (
        <div className="space-y-1">
          {transactions.map((t, index) => {
            const isIncome = t.type === 'income'
            const isTransfer = t.type === 'transfer'
            const rawCatName = t.category?.name || (isTransfer ? 'Transfer' : 'Uncategorized')
            const { emoji, name: cleanCatName } = extractCategoryEmojiAndName(rawCatName, t.type)
            const { icon: Icon, bg, color } = getCategoryIcon(cleanCatName, t.type)

            const amountColor = isIncome
              ? 'text-emerald-600'
              : isTransfer
              ? 'text-indigo-600'
              : 'text-slate-900'

            const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-'

            return (
              <div
                key={t.id || index}
                className="flex items-center gap-3.5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 -mx-2 px-2.5 rounded-2xl transition-all"
              >
                {/* Category Icon Avatar: Emoji replaces icon inside the container */}
                <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center shrink-0 shadow-xs border border-white/60 text-lg`}>
                  {isTransfer ? <Icon size={18} className={color} /> : <span>{emoji}</span>}
                </div>

                {/* Info (Category, Wallet, Notes) */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {cleanCatName}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    <span className="font-medium text-slate-600">
                      {t.wallet?.name || 'Wallet'}
                    </span>
                    {isTransfer && t.to_wallet ? ` → ${t.to_wallet.name}` : ''}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>

                {/* Amount & Date */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold tracking-tight ${amountColor}`}>
                    {amountPrefix}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {formatDate(t.transaction_date)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
