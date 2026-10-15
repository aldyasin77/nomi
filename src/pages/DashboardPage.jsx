import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowLeftRight,
  CreditCard,
  Target,
  Eye,
  EyeOff,
  TrendingUp,
  Nfc,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions, getMonthRange } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import KPICards from '@/components/dashboard/KPICards'
import ExpensePieChart from '@/components/dashboard/ExpensePieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import BudgetSection from '@/components/dashboard/BudgetSection'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import TransactionModal from '@/components/transactions/TransactionModal'
import { Shader, Godrays } from '@/components/shaders'
import NotificationBell from '@/components/notifications/NotificationBell'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import logoSvg from '@/assets/logo.svg'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [modalInitialType, setModalInitialType] = useState('expense')
  const [showBalance, setShowBalance] = useState(true)

  const { wallets, totalBalance, refetch: refetchWallets } = useWallets()
  const { categories } = useCategories()

  // Primary / Featured Wallet (first wallet or virtual summary)
  const mainWallet = wallets[0] || null

  // Current month transactions (for KPIs, pie chart, budgets)
  const currentMonth = useMemo(() => getMonthRange(0), [])
  const { transactions: monthTransactions, refetch: refetchMonth } = useTransactions({
    startDate: currentMonth.startDate,
    endDate: currentMonth.endDate,
  })

  // Last 6 months transactions (for trend chart)
  const sixMonthsAgo = useMemo(() => {
    const range = getMonthRange(-5)
    return { startDate: range.startDate, endDate: getMonthRange(0).endDate }
  }, [])
  const { transactions: trendTransactions } = useTransactions({
    startDate: sixMonthsAgo.startDate,
    endDate: sixMonthsAgo.endDate,
  })

  // Recent 10 transactions
  const { transactions: recentTransactions, refetch: refetchRecent, addTransaction } = useTransactions({ limit: 10 })

  // Budget computation
  const { budgets, totalRemaining } = useBudgets(categories, monthTransactions)

  // Totals
  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const handleAddTransaction = async (payload) => {
    try {
      await addTransaction(payload)
      toast.success('Transaction added!')
      refetchMonth()
      refetchRecent()
      refetchWallets()
    } catch (err) {
      toast.error(err.message || 'Failed to add transaction')
      throw err
    }
  }

  const openAddModal = (type = 'expense') => {
    setModalInitialType(type)
    setShowTransactionModal(true)
  }

  const greetingName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Friend'

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* MOBILE VIEW (Single Column - Exactly matching reference) */}
      {/* ======================================================== */}
      <div className="md:hidden space-y-6 animate-fade-in">
        {/* a. Header & Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 bg-white shadow-xs border border-slate-100">
              <img src={logoSvg} alt="Nomi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Welcome back</h2>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Hi, {greetingName}
              </h1>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* b. Main Wallet Card (Godrays Shader Background & Contactless NFC) */}
        <div className="relative overflow-hidden isolate rounded-2xl p-5 text-white shadow-2xl bg-[#0F172A] border border-white/10">
          {/* Godrays Shader Canvas */}
          <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden rounded-2xl pointer-events-none">
            <Shader>
              <Godrays
                rayColor="#0284C7" // Warna sinar biru brand
                backgroundColor="#0F172A" // Background gelap navy
                intensity={0.9}
                density={0.5}
                speed={0.4}
                spotty={0.8}
                center={{ x: 0.5, y: -0.2 }} // Sinar memancar dari area tengah atas kartu
              />
            </Shader>
          </div>

          {/* Thin overlay gradient for high contrast & readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 pointer-events-none -z-5" />

          {/* Top row of Card */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center text-white/90 shadow-inner">
                <Nfc size={20} className="rotate-90" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white drop-shadow-xs">
                  {mainWallet ? mainWallet.name : 'Nomi Card'}
                </p>
                <p className="text-[11px] text-white/60 font-mono tracking-widest mt-0.5">
                  {mainWallet ? `${mainWallet.type.toUpperCase()} •••• 4829` : '•••• 4829'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black italic tracking-widest text-white/90 drop-shadow-xs">
                VISA
              </span>
            </div>
          </div>

          {/* Dark Liquid Glass Overlay Box */}
          <div className="mt-4 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 p-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/80">Total Balance</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer p-0.5"
                  aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                >
                  {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-400/20">
                <TrendingUp size={10} />
                <span>+3.4% this month</span>
              </span>
            </div>

            <p className="text-3xl font-extrabold tracking-tight mt-1 text-white drop-shadow-sm">
              {showBalance ? formatCurrency(mainWallet ? mainWallet.balance : totalBalance) : 'Rp ••••••••'}
            </p>
          </div>
        </div>

        {/* c. Quick Actions Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Quick Action</h2>
          <div className="grid grid-cols-4 gap-3">
            {/* 1. Add Transaction */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAddModal('expense')}
                className="w-14 h-14 rounded-full bg-[#1A2C4C] text-white flex items-center justify-center shadow-md shadow-indigo-950/20 active:scale-95 transition-transform cursor-pointer"
                aria-label="Add Transaction"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-semibold text-slate-700">Add</span>
            </div>

            {/* 2. Transfer */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAddModal('transfer')}
                className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100/80 text-[#1A2C4C] flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                aria-label="Transfer"
              >
                <ArrowLeftRight size={20} strokeWidth={2.2} />
              </button>
              <span className="text-xs font-semibold text-slate-700">Transfer</span>
            </div>

            {/* 3. Wallets */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/wallets')}
                className="w-14 h-14 rounded-full bg-cyan-50 border border-cyan-100/80 text-cyan-800 flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                aria-label="All Wallets"
              >
                <CreditCard size={20} strokeWidth={2.2} />
              </button>
              <span className="text-xs font-semibold text-slate-700">Cards</span>
            </div>

            {/* 4. Limits / Spending */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100/80 text-purple-800 flex items-center justify-center shadow-xs active:scale-95 transition-transform cursor-pointer"
                aria-label="Category Limits"
              >
                <Target size={20} strokeWidth={2.2} />
              </button>
              <span className="text-xs font-semibold text-slate-700">Budget</span>
            </div>
          </div>
        </div>

        {/* d. Recent Transactions Section */}
        <div>
          <RecentTransactions
            transactions={recentTransactions.slice(0, 5)}
            showViewAll={true}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP VIEW (Rich multi-card overview on larger screens) */}
      {/* ======================================================== */}
      <div className="hidden md:block space-y-8 animate-fade-in">
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview of your finances & spending limits
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button icon={Plus} onClick={() => openAddModal('expense')}>
              Add Transaction
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards
          totalBalance={totalBalance}
          totalExpenses={totalExpenses}
          totalBudgetRemaining={totalRemaining}
          totalIncome={totalIncome}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpensePieChart transactions={monthTransactions} />
          <MonthlyTrendChart transactions={trendTransactions} />
        </div>

        {/* Budget + Recent Transactions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetSection budgets={budgets} />
          <RecentTransactions transactions={recentTransactions} showViewAll={true} />
        </div>
      </div>

      {/* Shared Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSubmit={handleAddTransaction}
        wallets={wallets}
        categories={categories}
        initialTab={modalInitialType}
      />
    </div>
  )
}
