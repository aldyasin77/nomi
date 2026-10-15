import { useMemo } from 'react'

/**
 * Computes budget consumption per category.
 * Takes all expense transactions for the current month and groups them by category,
 * comparing against the category's monthly_limit.
 */
export function useBudgets(categories, transactions) {
  const budgets = useMemo(() => {
    // Only categories with a monthly limit
    const withLimits = categories.filter(c => c.monthly_limit && c.monthly_limit > 0)

    return withLimits.map(category => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category_id === category.id)
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

      const limit = parseFloat(category.monthly_limit)
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      const remaining = limit - spent

      return {
        categoryId: category.id,
        categoryName: category.name,
        spent,
        limit,
        percentage: Math.min(percentage, 100),
        rawPercentage: percentage,
        remaining,
        isOver: remaining < 0,
        status: percentage < 75 ? 'safe' : percentage < 100 ? 'warning' : 'danger',
      }
    })
  }, [categories, transactions])

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  return {
    budgets,
    totalBudget,
    totalSpent,
    totalRemaining,
  }
}
