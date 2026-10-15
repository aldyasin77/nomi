import GlassCard from '../ui/GlassCard'
import BudgetProgressBar from './BudgetProgressBar'
import EmptyState from '../ui/EmptyState'
import { Target } from 'lucide-react'

export default function BudgetSection({ budgets }) {
  if (!budgets || budgets.length === 0) {
    return (
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <h3 className="text-base font-bold text-slate-900 mb-6">Budget Progress</h3>
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Set monthly limits on your categories in Settings"
        />
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 animate-fade-in stagger-4">
      <h3 className="text-base font-bold text-slate-900 mb-6">Budget Progress</h3>
      <div className="space-y-5">
        {budgets.map((budget) => (
          <BudgetProgressBar
            key={budget.categoryId}
            categoryName={budget.categoryName}
            spent={budget.spent}
            limit={budget.limit}
            percentage={budget.rawPercentage}
            status={budget.status}
          />
        ))}
      </div>
    </GlassCard>
  )
}
