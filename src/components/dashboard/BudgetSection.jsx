import { useState } from 'react'
import GlassCard from '../ui/GlassCard'
import BudgetProgressBar from './BudgetProgressBar'
import EmptyState from '../ui/EmptyState'
import CategoryDetailModal from './CategoryDetailModal'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Target, Info } from 'lucide-react'

export default function BudgetSection({ budgets, startDate, endDate }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

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
          
          {/* Ikon Info Berwarna Biru dengan Hover / Click Tooltip Popover */}
          <Popover open={infoOpen} onOpenChange={setInfoOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setInfoOpen((prev) => !prev)}
                onMouseEnter={() => setInfoOpen(true)}
                onMouseLeave={() => setInfoOpen(false)}
                className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Informasi"
                aria-label="Info cara melihat transaksi kategori"
              >
                <Info size={15} strokeWidth={2.3} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={6}
              className="!w-auto !max-w-[240px] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl select-none text-center"
            >
              Klik kategori untuk melihat transaksi
            </PopoverContent>
          </Popover>
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
