import { useState, useMemo } from 'react'
import {
  Plus,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  MoreHorizontal,
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
import { useTransactions } from '../hooks/useTransactions'
import { useWallets } from '../hooks/useWallets'
import { useCategories } from '../hooks/useCategories'
import TransactionModal from '../components/transactions/TransactionModal'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'
import {
  INDONESIAN_MONTHS,
  formatDateHeader,
  groupTransactionsByDate,
  getJakartaDate,
} from '@/lib/dateUtils'

const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'
]

const TYPE_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
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

// Custom Tooltip Recharts dengan warna kontras modern
const ChartCustomTooltip = ({ active, payload, label, selectedMonth, selectedYear }) => {
  if (active && payload && payload.length) {
    const incomeItem = payload.find((p) => p.dataKey === 'income')
    const expenseItem = payload.find((p) => p.dataKey === 'expense')

    const titleText =
      selectedMonth === 'all'
        ? `${label} ${selectedYear}`
        : `Tgl ${label} ${INDONESIAN_MONTHS[selectedMonth]} ${selectedYear}`

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-slate-100 dark:border-slate-800 min-w-40 text-xs">
        <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
          {titleText}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Income
            </span>
            <span className="font-bold text-[#2563EB]">
              {formatCurrency(incomeItem?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              Outcome
            </span>
            <span className="font-bold text-[#DC2626]">
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

  // Chart filters: Bulan (default bulan saat ini) & Tahun
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())

  const { wallets, refetch: refetchWallets } = useWallets()
  const { categories } = useCategories()

  // Ambil semua transaksi tanpa filter type agar data chart selalu lengkap
  const { transactions, refetch, addTransaction } = useTransactions()

  const handleAddTransaction = async (payload) => {
    try {
      const data = await addTransaction(payload)
      toast.success('Transaksi berhasil dicatat!')
      refetch()
      refetchWallets()
      return data
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat transaksi')
      throw err
    }
  }

  // BAGIAN 2: Logika Data Chart Dinamis (Harian per Bulan atau Bulanan per Tahun)
  const chartData = useMemo(() => {
    // Mode 1: Jika 'Semua Bulan' dipilih -> X-Axis = 12 Bulan (JAN - DES)
    if (selectedMonth === 'all') {
      const months = MONTH_LABELS.map((name, index) => ({
        monthIndex: index,
        name,
        income: 0,
        expense: 0,
      }))

      transactions.forEach((t) => {
        const rawDate = t.transaction_date || t.created_at
        if (!rawDate) return
        const d = getJakartaDate(rawDate)
        if (d.getFullYear() === selectedYear) {
          const mIdx = d.getMonth()
          const amt = parseFloat(t.amount) || 0
          if (t.type === 'income') {
            months[mIdx].income += amt
          } else if (t.type === 'expense') {
            months[mIdx].expense += amt
          }
        }
      })

      return months
    }

    // Mode 2: Jika Bulan spesifik dipilih -> X-Axis = Tanggal harian (1, 2, ..., 30/31)
    const monthNum = Number(selectedMonth)
    const daysInMonth = new Date(selectedYear, monthNum + 1, 0).getDate()

    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      name: `${i + 1}`,
      income: 0,
      expense: 0,
    }))

    transactions.forEach((t) => {
      const rawDate = t.transaction_date || t.created_at
      if (!rawDate) return
      const d = getJakartaDate(rawDate)
      if (d.getFullYear() === selectedYear && d.getMonth() === monthNum) {
        const dayIdx = d.getDate() - 1
        const amt = parseFloat(t.amount) || 0
        if (dayIdx >= 0 && dayIdx < daysInMonth) {
          if (t.type === 'income') {
            days[dayIdx].income += amt
          } else if (t.type === 'expense') {
            days[dayIdx].expense += amt
          }
        }
      }
    })

    return days
  }, [transactions, selectedYear, selectedMonth])

  // Summary statistics (Total Income & Outcome keseluruhan)
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }, [transactions])

  // Hitung saldo berjalan (running balance) historis per dompet
  const runningBalancesMap = useMemo(() => {
    if (!wallets || wallets.length === 0) return {}

    const sortedAsc = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date || a.created_at).getTime()
      const dateB = new Date(b.transaction_date || b.created_at).getTime()
      return dateA - dateB
    })

    // Hitung net delta per wallet
    const walletDeltas = {}
    sortedAsc.forEach((t) => {
      const amt = parseFloat(t.amount) || 0
      if (t.wallet_id) {
        if (!walletDeltas[t.wallet_id]) walletDeltas[t.wallet_id] = 0
        if (t.type === 'income') walletDeltas[t.wallet_id] += amt
        else if (t.type === 'expense') walletDeltas[t.wallet_id] -= amt
        else if (t.type === 'transfer') walletDeltas[t.wallet_id] -= amt
      }
      if (t.to_wallet_id && t.type === 'transfer') {
        if (!walletDeltas[t.to_wallet_id]) walletDeltas[t.to_wallet_id] = 0
        walletDeltas[t.to_wallet_id] += amt
      }
    })

    // Baseline balance awal sebelum transaksi tercatat
    const currentWalletBalances = {}
    wallets.forEach((w) => {
      const current = parseFloat(w.balance) || 0
      const delta = walletDeltas[w.id] || 0
      currentWalletBalances[w.id] = current - delta
    })

    const map = {}
    sortedAsc.forEach((t) => {
      const amt = parseFloat(t.amount) || 0
      if (t.wallet_id) {
        if (currentWalletBalances[t.wallet_id] === undefined) {
          currentWalletBalances[t.wallet_id] = 0
        }
        if (t.type === 'income') currentWalletBalances[t.wallet_id] += amt
        else if (t.type === 'expense') currentWalletBalances[t.wallet_id] -= amt
        else if (t.type === 'transfer') currentWalletBalances[t.wallet_id] -= amt
        map[t.id] = currentWalletBalances[t.wallet_id]
      }
    })

    return map
  }, [transactions, wallets])

  // Filter transaksi untuk list berdasarkan tipe dan search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter && t.type !== typeFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        t.note?.toLowerCase().includes(q) ||
        t.category?.name?.toLowerCase().includes(q) ||
        t.wallet?.name?.toLowerCase().includes(q) ||
        t.to_wallet?.name?.toLowerCase().includes(q)
      )
    })
  }, [transactions, typeFilter, searchQuery])

  // BAGIAN 1: Grouping transaksi berdasarkan tanggal
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions)
  }, [filteredTransactions])

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {/* 1. Header Page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lacak riwayat pemasukan, pengeluaran, dan mutasi saldo
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

      {/* 2. BAGIAN 2: Transaction Overview Card with Recharts Area Chart */}
      <GlassCard className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Transaction Overview
            </h2>
            {/* Legend dengan warna baru yang kontras */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                Outcome
              </span>
            </div>
          </div>

          {/* Filter Dropdowns: Bulan & Tahun */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Dropdown Bulan */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="appearance-none bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 pl-3 pr-7 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700 outline-none cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/80 transition-colors"
                aria-label="Filter Bulan"
              >
                <option value="all">Semua Bulan</option>
                {INDONESIAN_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Dropdown Tahun */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 pl-3 pr-7 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700 outline-none cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/80 transition-colors"
                aria-label="Filter Tahun"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Recharts Area Chart dengan gradasi transparan modern */}
        <div className="h-56 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outcomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={selectedMonth !== 'all' ? 2 : 0}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={formatShortAmount}
              />
              <Tooltip
                content={
                  <ChartCustomTooltip
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                }
              />
              {/* Income: Biru #2563EB */}
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#2563EB"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
                activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              />
              {/* Outcome: Merah #DC2626 */}
              <Area
                type="monotone"
                dataKey="expense"
                name="Outcome"
                stroke="#DC2626"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#outcomeGradient)"
                activeDot={{ r: 6, fill: '#DC2626', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* 3. Summary Cards: Total Income & Total Outcome */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Income Card */}
        <GlassCard className="flex-1 p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 flex items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Income
              </p>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight mt-0.5">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Expense Card */}
        <GlassCard className="flex-1 p-5 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_8px_25px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 flex items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100/80 dark:border-rose-900/60 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-xs">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Outcome
              </p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-0.5">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl gap-1 overflow-x-auto">
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`
                px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                ${
                  typeFilter === opt.value
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full sm:w-60 h-10 pl-9 pr-3 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]"
          />
        </div>
      </div>

      {/* 5. BAGIAN 1: Flat Transaction List menyatu dengan background */}
      <div className="space-y-6 pt-1">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Tidak ada transaksi
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `Tidak ada transaksi yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada catatan transaksi yang sesuai filter.'}
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full text-xs"
              onClick={() => setShowModal(true)}
            >
              + Catat Transaksi Baru
            </Button>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([dateStr, items]) => {
            // Kalkulasi Total Harian: Total = (Pemasukan hari itu) - (Pengeluaran hari itu)
            const dailyTotal = items.reduce((sum, tx) => {
              const amt = parseFloat(tx.amount) || 0
              if (tx.type === 'income') return sum + amt
              if (tx.type === 'expense') return sum - amt
              return sum
            }, 0)

            return (
              <div key={dateStr} className="space-y-0.5">
                {/* Header per tanggal: flex justify-between items-center py-3 border-b-2 border-slate-100 font-bold */}
                <div className="flex justify-between items-center py-3 border-b-2 border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                  <span className="text-base sm:text-lg tracking-tight">
                    {formatDateHeader(dateStr)}
                  </span>
                  <span
                    className={`text-base sm:text-lg ${
                      dailyTotal > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : dailyTotal < 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {dailyTotal > 0 ? '+' : dailyTotal < 0 ? '-' : ''}
                    {formatCurrency(Math.abs(dailyTotal))}
                  </span>
                </div>

                {/* List Item Transaksi di bawah tanggal */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {items.map((tx) => {
                    const amt = parseFloat(tx.amount) || 0
                    const isIncome = tx.type === 'income'
                    const isExpense = tx.type === 'expense'
                    const isTransfer = tx.type === 'transfer'
                    const isAdjustment = tx.note === 'Penyesuaian saldo'

                    // Sisa saldo tercatat setelah transaksi ini
                    const balanceAfter = runningBalancesMap[tx.id]

                    // Category extraction
                    const rawCategory = isAdjustment
                      ? tx.category?.name && !tx.category.name.toLowerCase().includes('food')
                        ? tx.category
                        : '⋯ Lain-lain'
                      : tx.category || (isTransfer ? 'Transfer' : 'Umum')

                    const catData = extractCategoryEmojiAndName(
                      rawCategory,
                      isIncome ? 'income' : 'expense'
                    )

                    const title =
                      tx.note ||
                      (isTransfer
                        ? isIncome
                          ? `Transfer dari ${tx.wallet?.name || 'Dompet lain'}`
                          : `Transfer ke ${tx.to_wallet?.name || 'Dompet lain'}`
                        : catData.name || 'Transaksi')

                    const subtitle = isTransfer
                      ? 'Transfer Antar Dompet'
                      : isAdjustment
                        ? 'Lain-lain'
                        : catData.name || 'Umum'

                    const isThreeDots = isAdjustment || catData.emoji === '⋯' || catData.emoji === '…'

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Kiri: Ikon */}
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div className="w-11 h-11 rounded-full border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 text-base shadow-2xs bg-slate-50/60 dark:bg-slate-800/50">
                            {isTransfer ? (
                              <ArrowRightLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            ) : isThreeDots ? (
                              <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            ) : (
                              <span>{catData.emoji}</span>
                            )}
                          </div>

                          {/* Tengah: Judul & Kategori */}
                          <div className="min-w-0">
                            <p className="text-base font-medium text-slate-900 dark:text-white truncate">
                              {title}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              <span className="font-medium text-slate-500 dark:text-slate-400">
                                {subtitle}
                              </span>
                              {tx.wallet?.name && (
                                <span className="text-slate-400 dark:text-slate-500">
                                  {` · ${tx.wallet.name}`}
                                </span>
                              )}
                              {isTransfer && tx.to_wallet?.name && (
                                <span className="text-slate-400 dark:text-slate-500">
                                  {` → ${tx.to_wallet.name}`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Kanan: Nominal (+/-) & Sisa Saldo */}
                        <div className="text-right shrink-0">
                          <p
                            className={`text-base font-bold tracking-tight ${
                              isIncome
                                ? 'text-blue-600 dark:text-blue-400'
                                : isExpense
                                  ? 'text-red-500 dark:text-red-400'
                                  : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isIncome ? '+' : isExpense ? '-' : ''}
                            {formatCurrency(amt)}
                          </p>
                          {balanceAfter !== undefined && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              saldo {formatCurrency(balanceAfter)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

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
