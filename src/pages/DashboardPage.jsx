import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import {
  Plus,
  ArrowLeftRight,
  CreditCard,
  Target,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react'
import { calculateBalanceGrowth } from '@/lib/analyticsUtils'
import { useAuth } from '@/context/AuthContext'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions, getMonthRange } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import { WALLET_THEMES, detectTheme } from '@/data/walletThemes'
import KPICards from '@/components/dashboard/KPICards'
import ExpensePieChart from '@/components/dashboard/ExpensePieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import BudgetSection from '@/components/dashboard/BudgetSection'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import TransactionModal from '@/components/transactions/TransactionModal'
import NotificationBell from '@/components/notifications/NotificationBell'
import WalletCard from '@/components/wallets/WalletCard'
import Button from '@/components/ui/Button'
import { Godrays } from '@shaders/react'
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

// ─── Embla Pagination Dots ──────────────────────────────────────────────
function CarouselDots({ emblaApi, activeThemeKey }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => emblaApi.off('select', onSelect)
  }, [emblaApi, onSelect])

  const themeData = WALLET_THEMES[activeThemeKey] || WALLET_THEMES.aurora

  return (
    <div className="flex justify-center gap-1.5 mt-4">
      {scrollSnaps.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => emblaApi?.scrollTo(i)}
          className="p-0 border-0 cursor-pointer transition-all duration-300"
          style={{
            width: i === selectedIndex ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i === selectedIndex ? themeData.dotColor : 'rgba(148,163,184,0.35)',
          }}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [modalInitialType, setModalInitialType] = useState('expense')
  const [showBalance, setShowBalance] = useState(true)
  const [activeWalletIndex, setActiveWalletIndex] = useState(0)

  const { wallets, totalBalance, refetch: refetchWallets } = useWallets()
  const { categories } = useCategories()

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    loop: false,
  })

  // Track active wallet for dot color
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveWalletIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => emblaApi.off('select', onSelect)
  }, [emblaApi])

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

  // Month-over-Month balance growth calculation
  const balanceGrowth = useMemo(() => {
    return calculateBalanceGrowth(totalBalance, monthTransactions)
  }, [totalBalance, monthTransactions])

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
  const avatarUrl = user?.user_metadata?.avatar_url || (user?.isDemo ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 12) return 'Good morning!'
    if (hour >= 12 && hour < 17) return 'Good afternoon!'
    if (hour >= 17 && hour < 21) return 'Good evening!'
    return 'Welcome Back'
  }

  // Active wallet theme key for dot colors
  const activeWallet = wallets[activeWalletIndex] || wallets[0]
  const activeThemeKey = activeWallet?.card_theme || detectTheme(activeWallet?.name || '')

  return (
    <div className="space-y-0">
      {/* ======================================================== */}
      {/* MOBILE VIEW — Two-Section Layout                         */}
      {/* ======================================================== */}
      <div className="md:hidden animate-fade-in">
        {/* ── SECTION A: Blue Hero Header ─────────────────────── */}
        <div className="dashboard-hero-section -mx-4 -mt-4 pb-28 rounded-b-3xl relative overflow-hidden">
          {/* Background Shader Godrays */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-b-3xl pointer-events-none opacity-60">
            <Godrays
              rayColor="#38bdf8"
              backgroundColor="#0b1b36"
              intensity={0.7}
              speed={0.3}
            />
          </div>

          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(49,46,129,0.2),transparent_60%)] pointer-events-none" />

          {/* Liquid Glass Greetings Section */}
          <div className="mx-4 mt-4 p-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={greetingName}
                  className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shrink-0 shadow-xs">
                  <img src={logoSvg} alt="Nomi Logo" />
                </div>
              )}
              <div className="min-w-0 text-left">
                <p className="text-xs text-white/80 font-medium tracking-tight leading-tight">
                  {getGreeting()}
                </p>
                <h1 className="text-base font-bold text-white tracking-tight truncate leading-snug">
                  {greetingName}
                </h1>
              </div>
            </div>
            <NotificationBell className="text-white shrink-0" />
          </div>

          {/* Total Balance */}
          <div className="mt-6 px-5 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-white/60">Total Saldo Semua Kantong</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/50 hover:text-white transition-colors cursor-pointer p-0.5"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <p className="text-[2rem] font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
              {showBalance ? formatCurrency(totalBalance) : 'Rp ••••••••'}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  balanceGrowth > 0
                    ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20'
                    : balanceGrowth < 0
                    ? 'bg-red-400/15 text-red-300 border-red-400/20'
                    : 'bg-white/10 text-white/70 border-white/10'
                }`}
              >
                {balanceGrowth > 0 ? (
                  <TrendingUp size={10} className="text-emerald-400" />
                ) : balanceGrowth < 0 ? (
                  <TrendingDown size={10} className="text-red-400" />
                ) : null}
                <span>
                  {balanceGrowth > 0 ? '+' : balanceGrowth < 0 ? '-' : ''}
                  {Math.abs(balanceGrowth).toFixed(1)}% bulan ini
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ── WALLET CAROUSEL (Overlapping) ───────────────────── */}
        <div className="relative z-20 -mt-20 px-1">
          {wallets.length > 0 ? (
            <>
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex-[0_0_85%] min-w-0"
                      style={{ maxWidth: '340px' }}
                    >
                      <WalletCard
                        wallet={wallet}
                        compact
                        transactions={trendTransactions || monthTransactions}
                      />
                    </div>
                  ))}
                  {/* "Add Wallet" ghost card */}
                  <div
                    className="flex-[0_0_85%] min-w-0"
                    style={{ maxWidth: '340px' }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate('/wallets')}
                      className="w-full h-[190px] rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <Plus size={28} strokeWidth={1.5} />
                      <span className="text-xs font-semibold">Tambah Kantong</span>
                    </button>
                  </div>
                </div>
              </div>
              <CarouselDots emblaApi={emblaApi} activeThemeKey={activeThemeKey} />
            </>
          ) : (
            <div className="mx-3">
              <button
                type="button"
                onClick={() => navigate('/wallets')}
                className="w-full h-36 rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer"
              >
                <Plus size={28} strokeWidth={1.5} />
                <span className="text-xs font-semibold">Buat Kantong Pertamamu</span>
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION B: Light Content Area ───────────────────── */}
        <div className="mt-4 space-y-5 px-0">
          {/* Quick Actions */}
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

              {/* 4. Budget */}
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

          {/* Recent Transactions */}
          <div>
            <RecentTransactions
              transactions={recentTransactions.slice(0, 5)}
              showViewAll={true}
            />
          </div>
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
          balanceGrowth={balanceGrowth}
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
