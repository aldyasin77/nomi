import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import BudgetProgressBar from './BudgetProgressBar'
import EmptyState from '../ui/EmptyState'
import CategoryDetailModal from './CategoryDetailModal'
import { Target } from 'lucide-react'

export default function BudgetSection({ budgets, startDate, endDate }) {
  const [selectedCategory, setSelectedCategory] = useState(null)

  if (!budgets || budgets.length === 0) {
    return (
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Budget Progress</h3>
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Set monthly limits on your categories in Settings"
        />
      </GlassCard>
    )
  }

  return (
    <>
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Budget Progress</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Klik kategori untuk melihat transaksi
          </span>
        </div>
        <div className="space-y-4">
          {budgets.map((budget) => (
            <BudgetProgressBar
              key={budget.categoryId}
              categoryName={budget.categoryName}
              spent={budget.spent}
              limit={budget.limit}
              percentage={budget.rawPercentage}
              status={budget.status}
              onClick={() => setSelectedCategory(budget)}
            />
          ))}
        </div>
      </GlassCard>

      {/* Modal Detail Transaksi Kategori Terfilter */}
      <CategoryDetailModal
        isOpen={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        startDate={startDate}
        endDate={endDate}
      />
    </>
  )
}
