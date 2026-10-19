import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Wallet as WalletIcon,
  Search,
} from 'lucide-react'
import { useWallets } from '@/hooks/useWallets'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import BankItemIcon from '@/components/wallets/BankItemIcon'
import WalletFormModal from '@/components/wallets/WalletFormModal'
import TransactionModal from '@/components/transactions/TransactionModal'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NumericFormat } from 'react-number-format'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'
import toast from 'react-hot-toast'
import CustomNumpad from '@/components/common/CustomNumpad'
import { useIsMobile } from '@/hooks/useIsMobile'

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateHeader(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateDateString = date.toISOString().split('T')[0]
  const todayDateString = today.toISOString().split('T')[0]
  const yesterdayDateString = yesterday.toISOString().split('T')[0]

  if (dateDateString === todayDateString) return 'Hari ini'
  if (dateDateString === yesterdayDateString) return 'Kemarin'

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const dayName = days[date.getDay()]
  const dayNum = date.getDate()
  const monthName = INDONESIAN_MONTHS[date.getMonth()]
  const year = date.getFullYear()

  return `${dayName}, ${dayNum} ${monthName} ${year}`
}

export default function WalletDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { wallets, loading: walletsLoading, updateWallet } = useWallets()
  const { transactions, addTransaction } = useTransactions()
  const { categories } = useCategories()

  // Find target wallet
  const wallet = useMemo(() => {
    return wallets.find((w) => w.id === id) || null
  }, [wallets, id])

  // State for Month Filter (defaults to current date)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const selectedYear = currentDate.getFullYear()
  const selectedMonth = currentDate.getMonth() // 0-indexed

  // Filter chips: 'all' | 'income' | 'expense'
  const [typeFilter, setTypeFilter] = useState('all')

  // Modals state
  const isMobile = useIsMobile()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionModalTab, setTransactionModalTab] = useState('expense')
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false)
  const [newBalanceInput, setNewBalanceInput] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isAdjustNumpadOpen, setIsAdjustNumpadOpen] = useState(false)

  // Navigate month
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Filter all transactions strictly related to this wallet
  const walletTransactionsAll = useMemo(() => {
    if (!wallet) return []
    return transactions.filter(
      (t) => t.wallet_id === wallet.id || t.to_wallet_id === wallet.id
    )
  }, [transactions, wallet])

  // Monthly summary (Income & Expense this month for this specific wallet)
  const monthlySummary = useMemo(() => {
    if (!wallet) return { income: 0, expense: 0 }

    let income = 0
    let expense = 0

    walletTransactionsAll.forEach((t) => {
      if (!t.transaction_date) return
      const tDate = new Date(t.transaction_date)
      if (tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth) {
        const amt = parseFloat(t.amount) || 0
        if (t.type === 'income' && t.wallet_id === wallet.id) {
          income += amt
        } else if (t.type === 'expense' && t.wallet_id === wallet.id) {
          expense += amt
        } else if (t.type === 'transfer') {
          if (t.to_wallet_id === wallet.id) {
            income += amt // Dana masuk dari transfer
          } else if (t.wallet_id === wallet.id) {
            expense += amt // Dana keluar untuk transfer
          }
        }
      }
    })

    return { income, expense }
  }, [wallet, walletTransactionsAll, selectedYear, selectedMonth])

  // Calculate historical running balances for each transaction
  // Sort transactions chronologically ascending to compute running balances,
  // then map back to each transaction.
  const runningBalancesMap = useMemo(() => {
    if (!wallet) return {}

    // Sort ascending by date & created_at
    const sortedAsc = [...walletTransactionsAll].sort((a, b) => {
      const dateA = new Date(a.transaction_date || a.created_at).getTime()
      const dateB = new Date(b.transaction_date || b.created_at).getTime()
      return dateA - dateB
    })

    // Compute cumulative delta
    let netDeltaTotal = 0
    sortedAsc.forEach((t) => {
      const amt = parseFloat(t.amount) || 0
      const isIncoming =
        t.type === 'income' || (t.type === 'transfer' && t.to_wallet_id === wallet.id)
      if (isIncoming) {
        netDeltaTotal += amt
      } else {
        netDeltaTotal -= amt
      }
    })

    // Starting baseline balance before all recorded transactions
    const currentBalance = parseFloat(wallet.balance) || 0
    let running = currentBalance - netDeltaTotal

    const map = {}
    sortedAsc.forEach((t) => {
      const amt = parseFloat(t.amount) || 0
      const isIncoming =
        t.type === 'income' || (t.type === 'transfer' && t.to_wallet_id === wallet.id)
      if (isIncoming) {
        running += amt
      } else {
        running -= amt
      }
      map[t.id] = running
    })

    return map
  }, [wallet, walletTransactionsAll])

  // Filtered transactions for current view (Month + Type Filter)
  const filteredTransactions = useMemo(() => {
    if (!wallet) return []

    return walletTransactionsAll
      .filter((t) => {
        if (!t.transaction_date) return false
        const tDate = new Date(t.transaction_date)
        const inMonth =
          tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth
        if (!inMonth) return false

        const isIncoming =
          t.type === 'income' || (t.type === 'transfer' && t.to_wallet_id === wallet.id)

        if (typeFilter === 'income') return isIncoming
        if (typeFilter === 'expense') return !isIncoming
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.created_at).getTime()
        const dateB = new Date(b.transaction_date || b.created_at).getTime()
        return dateB - dateA
      })
  }, [wallet, walletTransactionsAll, selectedYear, selectedMonth, typeFilter])

  // Group transactions by date string
  const groupedTransactions = useMemo(() => {
    const groups = {}
    filteredTransactions.forEach((t) => {
      const dateKey = t.transaction_date || 'Unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return groups
  }, [filteredTransactions])

  // Quick Action: Handle Update Wallet from modal
  const handleWalletUpdate = async (data) => {
    try {
      await updateWallet(wallet.id, data)
      toast.success('Informasi dompet berhasil diperbarui!')
      setShowEditModal(false)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui dompet')
    }
  }

  // Quick Action: Handle Adjust Balance Submit
  const handleSaveBalanceAdjustment = async (e) => {
    e.preventDefault()
    if (!wallet) return
    setIsAdjusting(true)
    try {
      const newBal = parseFloat(newBalanceInput) || 0
      await updateWallet(wallet.id, { balance: newBal })
      toast.success('Saldo berhasil diatur!')
      setShowAdjustBalanceModal(false)
    } catch (err) {
      toast.error(err.message || 'Gagal mengatur saldo')
    } finally {
      setIsAdjusting(false)
    }
  }

  // Quick Action: Handle Transaction Submit
  const handleTransactionSubmit = async (data) => {
    try {
      await addTransaction(data)
      toast.success('Transaksi berhasil dicatat!')
      setShowTransactionModal(false)
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat transaksi')
      throw err
    }
  }

  if (walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <WalletIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Dompet Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6">
          Dompet yang kamu cari tidak tersedia atau telah dihapus.
        </p>
        <Button onClick={() => navigate('/wallets')}>Kembali ke Daftar Dompet</Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Responsive Grid: Mobile = stack (col-1), Desktop = 3 cols (1/3 left, 2/3 right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* ========================================================= */}
        {/* KOLOM KIRI (1/3 bagian): Info Dompet, Saldo, Quick Actions */}
        {/* ========================================================= */}
        <div className="md:col-span-1 md:sticky md:top-6 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {/* Top Navigation Row: Back Button & Edit Button */}
            <div className="flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={() => navigate('/wallets')}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>
            </div>

            {/* Wallet Logo, Name & Type */}
            <div className="flex items-center gap-3.5 pb-5">
              <BankItemIcon
                item={wallet}
                size="lg"
                className="shadow-sm"
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate tracking-tight">
                  {wallet.name}
                </h1>
                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                  {wallet.type || 'Tabungan'}
                </p>
              </div>
            </div>

            {/* Total Balance */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Saldo
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 truncate">
                {formatCurrency(parseFloat(wallet.balance) || 0)}
              </h2>
            </div>

            {/* Kotak Ringkasan Bulan Ini (divide-x, Masuk & Keluar) */}
            <div className="border-y border-slate-100 dark:border-slate-800 py-4 my-5 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
              <div className="pr-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Masuk bulan ini
                </p>
                <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
                  {formatCurrency(monthlySummary.income)}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Keluar bulan ini
                </p>
                <p className="text-base sm:text-lg font-bold text-red-500 dark:text-red-400 mt-1 truncate">
                  {formatCurrency(monthlySummary.expense)}
                </p>
              </div>
            </div>

            {/* Tombol Quick Actions: + Catat, ⇆ Transfer, ✎ Atur saldo */}
            <div className="flex gap-2 w-full pt-1">
              <Button
                variant="outline"
                className="rounded-full flex-1 h-9 px-2 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => {
                  setTransactionModalTab('expense')
                  setShowTransactionModal(true)
                }}
              >
                + Catat
              </Button>
              <Button
                variant="outline"
                className="rounded-full flex-1 h-9 px-2 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => {
                  setTransactionModalTab('transfer')
                  setShowTransactionModal(true)
                }}
              >
                ⇆ Transfer
              </Button>
              <Button
                variant="outline"
                className="rounded-full flex-1 h-9 px-2 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => {
                  setNewBalanceInput(wallet.balance?.toString() || '0')
                  setShowAdjustBalanceModal(true)
                }}
              >
                ✎ Atur saldo
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* KOLOM KANAN (2/3 bagian): Daftar Transaksi & Filter        */}
        {/* ========================================================= */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {/* Header Transaksi & Navigasi Bulan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Transaksi
              </h3>

              {/* Month Navigator (< Oktober 2026 >) */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-2 min-w-[110px] text-center select-none">
                  {INDONESIAN_MONTHS[selectedMonth]} {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Chips: Semua, Masuk, Keluar */}
            <div className="flex items-center gap-2 pt-4 pb-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-[#1A2C4C] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'income'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'expense'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Keluar
              </button>
            </div>

            {/* Transaction List Grouped by Date */}
            <div className="mt-4 space-y-6">
              {Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tidak ada transaksi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Belum ada riwayat transaksi pada {INDONESIAN_MONTHS[selectedMonth]} {selectedYear}.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-full text-xs"
                    onClick={() => {
                      setTransactionModalTab('expense')
                      setShowTransactionModal(true)
                    }}
                  >
                    + Catat Transaksi Baru
                  </Button>
                </div>
              ) : (
                Object.entries(groupedTransactions).map(([dateStr, items]) => (
                  <div key={dateStr} className="space-y-2">
                    {/* Date Section Header */}
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                      {formatDateHeader(dateStr)}
                    </p>

                    {/* Transaction Items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                      {items.map((tx) => {
                        const amt = parseFloat(tx.amount) || 0
                        const isIncome =
                          tx.type === 'income' ||
                          (tx.type === 'transfer' && tx.to_wallet_id === wallet.id)
                        const isTransfer = tx.type === 'transfer'

                        // Sisa saldo tercatat setelah transaksi ini
                        const balanceAfter = runningBalancesMap[tx.id]

                        // Category extraction
                        const catData = extractCategoryEmojiAndName(
                          tx.category || (isTransfer ? 'Transfer' : 'Umum'),
                          isIncome ? 'income' : 'expense'
                        )

                        const title = tx.note || (isTransfer ? (isIncome ? `Transfer dari ${tx.wallet?.name || 'Dompet lain'}` : `Transfer ke ${tx.to_wallet?.name || 'Dompet lain'}`) : catData.name || 'Transaksi')
                        const subtitle = isTransfer ? 'Transfer Antar Dompet' : catData.name || 'Umum'

                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            {/* Left: Icon & Category/Title */}
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base shadow-xs ${
                                  isTransfer
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                    : isIncome
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {isTransfer ? (
                                  <ArrowRightLeft className="w-4 h-4" />
                                ) : (
                                  <span>{catData.emoji}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {title}
                                </p>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                  {subtitle}
                                </p>
                              </div>
                            </div>

                            {/* Right: Amount & Sisa Saldo */}
                            <div className="text-right shrink-0">
                              <p
                                className={`text-sm sm:text-base font-bold tracking-tight ${
                                  isIncome
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}
                              >
                                {isIncome ? '+' : '-'}
                                {formatCurrency(amt)}
                              </p>
                              {balanceAfter !== undefined && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  saldo {formatCurrency(balanceAfter)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL EDIT DOMPET (Ubah)                                   */}
      {/* ========================================================= */}
      {showEditModal && (
        <WalletFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleWalletUpdate}
          editingWallet={wallet}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL TRANSAKSI (+ Catat & ⇆ Transfer)                     */}
      {/* ========================================================= */}
      {showTransactionModal && (
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={handleTransactionSubmit}
          wallets={wallets}
          categories={categories}
          initialTab={transactionModalTab}
          initialType={transactionModalTab}
          initialWalletId={wallet.id}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL ATUR SALDO (✎ Atur saldo)                            */}
      {/* ========================================================= */}
      <Dialog
        open={showAdjustBalanceModal}
        onOpenChange={(open) => !open && setShowAdjustBalanceModal(false)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Atur Saldo Dompet
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ubah saldo berjalan dompet {wallet.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBalanceAdjustment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Saldo Baru
              </label>
              <div className="relative flex items-center rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-4 py-3 focus-within:border-[#1A2C4C] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-[#1A2C4C]/10 transition-all">
                <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-2 select-none">
                  Rp
                </span>
                <NumericFormat
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  value={newBalanceInput}
                  onValueChange={(values) => {
                    setNewBalanceInput(
                      values.floatValue !== undefined ? values.floatValue : ''
                    )
                  }}
                  placeholder="0"
                  readOnly={isMobile}
                  inputMode={isMobile ? 'none' : 'numeric'}
                  onFocus={() => {
                    if (isMobile) setIsAdjustNumpadOpen(true)
                  }}
                  onClick={() => {
                    if (isMobile) setIsAdjustNumpadOpen(true)
                  }}
                  className="w-full text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-0 outline-none p-0 tracking-tight cursor-pointer sm:cursor-text"
                  autoFocus={!isMobile}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 rounded-2xl"
                onClick={() => setShowAdjustBalanceModal(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isAdjusting}
                className="flex-1 rounded-2xl bg-[#1A2C4C] hover:bg-[#13223b] text-white"
              >
                Simpan Saldo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Custom Calculator Numpad for Adjust Balance Dialog */}
      <CustomNumpad
        isOpen={isAdjustNumpadOpen && showAdjustBalanceModal}
        value={newBalanceInput}
        onChange={(val) => setNewBalanceInput(val)}
        onClose={() => setIsAdjustNumpadOpen(false)}
        onSubmit={() => setIsAdjustNumpadOpen(false)}
      />
    </div>
  )
}
