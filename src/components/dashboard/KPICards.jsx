import { Wallet, TrendingDown, PiggyBank, TrendingUp } from 'lucide-react'
import GlassCard from '../ui/GlassCard'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function KPICards({
  totalBalance,
  totalExpenses,
  totalBudgetRemaining,
  totalIncome,
  balanceGrowth = 0,
}) {
  const isPositive = balanceGrowth > 0
  const isNegative = balanceGrowth < 0
  const growthFormatted = `${isPositive ? '+' : isNegative ? '-' : ''}${Math.abs(balanceGrowth).toFixed(1)}%`

  const cards = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'text-[#1A2C4C]',
      bgColor: 'bg-[#1A2C4C]/5',
      trend: {
        value: `${growthFormatted} MoM`,
        isPositive,
        isNegative,
      },
    },
    {
      label: 'Income This Month',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: null,
    },
    {
      label: 'Expenses This Month',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      trend: null,
    },
    {
      label: 'Budget Remaining',
      value: formatCurrency(totalBudgetRemaining),
      icon: PiggyBank,
      color: totalBudgetRemaining >= 0 ? 'text-emerald-600' : 'text-rose-500',
      bgColor: totalBudgetRemaining >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <GlassCard
          key={card.label}
          className={`p-6 animate-fade-in stagger-${i + 1}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
              <card.icon size={18} className={card.color} />
            </div>
            {card.trend && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.trend.isPositive
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : card.trend.isNegative
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {card.trend.isPositive ? (
                  <TrendingUp size={13} className="text-emerald-500" />
                ) : card.trend.isNegative ? (
                  <TrendingDown size={13} className="text-red-500" />
                ) : null}
                <span>{card.trend.value}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mb-1">{card.label}</p>
          <p className={`text-2xl font-bold tracking-tight ${card.color}`}>
            {card.value}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}
