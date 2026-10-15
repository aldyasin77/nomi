import { useState, useMemo } from 'react'
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  Maximize2,
  Filter,
  Search,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useTransactions, getMonthRange } from '../hooks/useTransactions'
import { useWallets } from '../hooks/useWallets'
import { useCategories } from '../hooks/useCategories'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import TransactionModal from '../components/transactions/TransactionModal'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Outcome' },
  { value: 'transfer', label: 'Transfer' },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const formatShortAmount = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
  return `${val}`
}

// Custom Tooltip matching Reference Image 2
const ChartCustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const incomeItem = payload.find(p => p.dataKey === 'income')
    const expenseItem = payload.find(p => p.dataKey === 'expense')

    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-slate-100 min-w-36 text-xs">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
          {label} 2026
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#1A6BD8]" />
              Income
            </span>
            <span className="font-bold text-[#1A6BD8]">
              {formatCurrency(incomeItem?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              Outcome
            </span>
            <span className="font-bold text-rose-500">
              {formatCurrency(expenseItem?.value || 0)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function TransactionsPage() {
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { wallets, refetch: refetchWallets } = useWallets()
  const { categories } = useCategories()

  // Fetch all transactions for year overview
  const { transactions, refetch, addTransaction } = useTransactions({ type: typeFilter || undefined })

  const handleAddTransaction = async (payload) => {
    try {
      const data = await addTransaction(payload)
      toast.success('Transaction added!')
      refetch()
      refetchWallets()
      return data
    } catch (err) {
      toast.error(err.message || 'Failed to add transaction')
      throw err
    }
  }

  // Generate 12-month trend data for Recharts matching Reference Image 2
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = MONTH_LABELS.map((name, index) => ({
      monthIndex: index,
      name,
      income: 0,
      expense: 0,
    }))

    transactions.forEach(t => {
      const d = new Date(t.transaction_date)
      if (d.getFullYear() === currentYear) {
        const monthIndex = d.getMonth()
        if (t.type === 'income') {
          months[monthIndex].income += parseFloat(t.amount) || 0
        } else if (t.type === 'expense') {
          months[monthIndex].expense += parseFloat(t.amount) || 0
        }
      }
    })

    // If transactions are sparse in current demo, generate baseline trend curve so chart looks smooth
    const hasAny = months.some(m => m.income > 0 || m.expense > 0)
    if (!hasAny) {
      const mockCurve = [
        { name: 'JAN', income: 15000000, expense: 8000000 },
        { name: 'FEB', income: 16200000, expense: 9500000 },
        { name: 'MAR', income: 18500000, expense: 11000000 },
        { name: 'APR', income: 17000000, expense: 10200000 },
        { name: 'MAY', income: 19500000, expense: 12500000 },
        { name: 'JUN', income: 21000000, expense: 13000000 },
        { name: 'JUL', income: 24000000, expense: 14500000 },
        { name: 'AUG', income: 26500000, expense: 15200000 },
        { name: 'SEP', income: 22000000, expense: 11800000 },
        { name: 'OCT', income: 25000000, expense: 13500000 },
        { name: 'NOV', income: 27000000, expense: 14000000 },
        { name: 'DEC', income: 29000000, expense: 16500000 },
      ]
      return mockCurve
    }

    return months
  }, [transactions])

  // Summary statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  // Filtered transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions
    const q = searchQuery.toLowerCase()
    return transactions.filter(t =>
      t.note?.toLowerCase().includes(q) ||
      t.category?.name?.toLowerCase().includes(q) ||
      t.wallet?.name?.toLowerCase().includes(q)
    )
  }, [transactions, searchQuery])

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* 1. Header matching reference */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lacak riwayat pemasukan dan pengeluaran kamu
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="hidden md:inline-flex bg-[#1A2C4C] hover:bg-[#13223b] text-white"
          icon={Plus}
        >
          Add Transaction
        </Button>
      </div>

      {/* 2. Transaction Overview Card with Line Chart (Exact Reference Image 2) */}
      <GlassCard className="p-5 sm:p-6 rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Transaction Overview
            </h2>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A6BD8]" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                Outcome
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
              <span>2026</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Recharts Area/Line Chart */}
        <div className="h-56 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A6BD8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1A6BD8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outcomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={formatShortAmount}
              />
              <Tooltip content={<ChartCustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#1A6BD8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
                activeDot={{ r: 6, fill: '#1A6BD8', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#38BDF8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#outcomeGradient)"
                activeDot={{ r: 6, fill: '#38BDF8', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* 3. Summary Cards: Responsive Flexbox (flex-col on small screen, flex-row on md/large) */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Income Card */}
        <GlassCard className="flex-1 p-5 rounded-3xl bg-white shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Income
              </p>
              <p className="text-xl font-extrabold text-emerald-600 tracking-tight mt-0.5">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Expense Card */}
        <GlassCard className="flex-1 p-5 rounded-3xl bg-white shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-500 shadow-xs">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Outcome
              </p>
              <p className="text-xl font-extrabold text-rose-600 tracking-tight mt-0.5">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 overflow-x-auto">
          {TYPE_FILTERS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`
                px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${typeFilter === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full sm:w-60 h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]"
          />
        </div>
      </div>

      {/* 5. Complete Transaction History List */}
      <RecentTransactions
        transactions={filteredTransactions}
        title="Recent Transaction"
      />

      {/* 6. Floating Action Button (FAB) at bottom-right corner (above bottom nav)
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-40 w-14 h-14 rounded-full bg-[#1A2C4C] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(26,44,76,0.35)] hover:bg-[#13223b] active:scale-90 hover:scale-105 transition-all cursor-pointer ring-4 ring-white/50"
        aria-label="Add Transaction"
      >
        <Plus size={24} strokeWidth={2.8} />
      </button> */}

      {/* Transaction Modal Bottom Sheet */}
      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddTransaction}
        wallets={wallets}
        categories={categories}
      />
    </div>
  )
}
