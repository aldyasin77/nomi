import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Receipt, Wallet, ArrowDownLeft } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'
import { formatDateHeader, groupTransactionsByDate } from '@/lib/dateUtils'
import { getMonthRange } from '@/hooks/useTransactions'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export default function CategoryDetailModal({
  isOpen,
  onClose,
  category,
  startDate: propStartDate,
  endDate: propEndDate,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { user } = useAuth()
  const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Rentang bulan ini jika tidak di-pass dari props
  const defaultRange = useMemo(() => getMonthRange(0), [])
  const startDate = propStartDate || defaultRange.startDate
  const endDate = propEndDate || defaultRange.endDate

  const categoryId = category?.id || category?.categoryId
  const rawCategoryName = category?.name || category?.categoryName || ''
  const { emoji, name: cleanCategoryName } = extractCategoryEmojiAndName(rawCategoryName)

  // Fetch riwayat transaksi terfilter:
  // a) Hanya transaksi bulan ini (startDate s/d endDate)
  // b) Hanya transaksi dengan kategori yang dipilih: .eq('category_id', selectedCategory.id)
  // c) Terurut .order('created_at', { ascending: false })
  const fetchCategoryTransactions = useCallback(async () => {
    if (!categoryId || !isOpen) return

    setLoading(true)
    if (isDemo) {
      try {
        const stored = localStorage.getItem('nomi_demo_transactions')
        const all = stored ? JSON.parse(stored) : []
        const filtered = all.filter((t) => {
          if (t.category_id !== categoryId) return false
          const txDate = t.transaction_date || t.date
          if (!txDate) return false
          if (startDate && txDate < startDate) return false
          if (endDate && txDate > endDate) return false
          return true
        })

        // Sort descending by transaction_date & created_at
        filtered.sort((a, b) => {
          const dateDiff = new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0)
          if (dateDiff !== 0) return dateDiff
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        })

        setTransactions(filtered)
      } catch (err) {
        console.error('Error fetching demo transactions for category:', err)
        setTransactions([])
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          wallet:wallets!wallet_id(id, name, type),
          to_wallet:wallets!to_wallet_id(id, name, type),
          category:categories(id, name, type)
        `)
        .eq('category_id', categoryId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (startDate) query = query.gte('transaction_date', startDate)
      if (endDate) query = query.lte('transaction_date', endDate)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching category transactions from Supabase:', error)
        setTransactions([])
      } else {
        setTransactions(data || [])
      }
    } catch (err) {
      console.error('Failed to load category transactions:', err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [categoryId, isOpen, isDemo, startDate, endDate])

  useEffect(() => {
    fetchCategoryTransactions()
  }, [fetchCategoryTransactions])

  // Sinkronisasi otomatis saat ada transaksi yang baru/diedit
  useEffect(() => {
    const handleSync = () => {
      if (isOpen) fetchCategoryTransactions()
    }
    window.addEventListener('nomi_data_changed', handleSync)
    return () => window.removeEventListener('nomi_data_changed', handleSync)
  }, [isOpen, fetchCategoryTransactions])

  // Total terpakai dari transaksi yang terambil
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }, [transactions])

  // Date grouping ('Hari ini', 'Kemarin', dll)
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(transactions)
  }, [transactions])

  // Header dan Detail Statistik Kategori
  const headerContent = (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center text-2xl shadow-xs">
          {emoji}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {cleanCategoryName || 'Kategori'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Riwayat transaksi bulan ini
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Total Terpakai
        </p>
        <p className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400">
          {formatCurrency(totalSpent)}
        </p>
      </div>
    </div>
  )

  // Konten List Transaksi
  const listContent = (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-600 border-t-[#1A2C4C] rounded-full animate-spin" />
          <span className="text-xs">Memuat riwayat transaksi...</span>
        </div>
      ) : Object.keys(groupedTransactions).length === 0 ? (
        /* Empty State */
        <div className="py-14 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Belum ada transaksi di kategori ini
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Belum ada catatan pengeluaran untuk {cleanCategoryName} pada bulan berjalan.
          </p>
        </div>
      ) : (
        /* List Grouped by Date */
        Object.entries(groupedTransactions).map(([dateStr, items]) => {
          const dailyTotal = items.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)

          return (
            <div key={dateStr} className="space-y-1">
              {/* Header Tanggal */}
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>{formatDateHeader(dateStr)}</span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatCurrency(dailyTotal)}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((tx) => {
                  const amt = parseFloat(tx.amount) || 0
                  const isIncome = tx.type === 'income'
                  const title = tx.note || cleanCategoryName || 'Pengeluaran'
                  const walletName = tx.wallet?.name || 'Dompet'

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 text-xs">
                          <ArrowDownLeft size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {title}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Wallet size={12} className="shrink-0" />
                            <span className="truncate">{walletName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm font-bold tracking-tight ${
                            isIncome
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(amt)}
                        </p>
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
  )

  // DESKTOP / TABLET (Centered Dialog)
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader className="shrink-0 mb-2">
            <DialogTitle className="sr-only">
              Detail Kategori {cleanCategoryName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Riwayat transaksi untuk kategori {cleanCategoryName}
            </DialogDescription>
            {headerContent}
          </DialogHeader>

          {listContent}
        </DialogContent>
      </Dialog>
    )
  }

  // MOBILE (Bottom Sheet Drawer)
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[88vh] h-auto flex flex-col overflow-hidden rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        contentWrapperClassName="flex-1 flex flex-col overflow-hidden p-0 pb-2"
      >
        <DrawerHeader className="px-4 py-2.5 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          </DrawerClose>
          <DrawerTitle className="text-base font-bold text-slate-900 dark:text-white text-center">
            Detail Kategori
          </DrawerTitle>
          <div className="w-8 h-8" />
        </DrawerHeader>

        <div className="px-4 pt-3 shrink-0">
          {headerContent}
        </div>

        {listContent}
      </DrawerContent>
    </Drawer>
  )
}

