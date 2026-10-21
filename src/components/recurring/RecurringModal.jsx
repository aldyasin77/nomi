import React, { useState, useEffect, useMemo } from 'react'
import { NumericFormat } from 'react-number-format'
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
  DrawerClose,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Button from '@/components/ui/Button'
import CustomNumpad from '@/components/common/CustomNumpad'
import BankItemIcon from '@/components/wallets/BankItemIcon'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'
import {
  Wallet as WalletIcon,
  ArrowRightLeft,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Pencil,
  ChevronRight,
  X,
  Search,
  Bell,
} from 'lucide-react'

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'transfer', label: 'Transfer' },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export default function RecurringModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  wallets = [],
  categories = [],
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [loading, setLoading] = useState(false)
  const [isNumpadOpen, setIsNumpadOpen] = useState(true)
  const [dayPopoverOpen, setDayPopoverOpen] = useState(false)

  // Drawer for selecting wallets
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false)
  const [walletDrawerTarget, setWalletDrawerTarget] = useState('source') // 'source' | 'destination'

  // Drawer for selecting all categories
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

  const [form, setForm] = useState({
    type: 'expense',
    note: '',
    amount: '',
    execution_day: 1,
    wallet_id: '',
    to_wallet_id: '',
    category_id: '',
    is_active: true,
  })

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (form.type === 'income') return c.type === 'income'
      if (form.type === 'expense') return c.type === 'expense'
      return false
    })
  }, [categories, form.type])

  // Filter categories by search query inside Drawer
  const searchedCategories = useMemo(() => {
    if (!categorySearch.trim()) return filteredCategories
    const query = categorySearch.toLowerCase().trim()
    return filteredCategories.filter((c) => {
      const { name } = extractCategoryEmojiAndName(c.name, c.type)
      return name.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    })
  }, [filteredCategories, categorySearch])

  // Find selected wallet and category objects
  const selectedWallet = useMemo(() => {
    return wallets.find((w) => w.id === form.wallet_id) || wallets[0] || null
  }, [wallets, form.wallet_id])

  const selectedToWallet = useMemo(() => {
    return wallets.find((w) => w.id === form.to_wallet_id) || null
  }, [wallets, form.to_wallet_id])

  const selectedCategory = useMemo(() => {
    return filteredCategories.find((c) => c.id === form.category_id) || filteredCategories[0] || null
  }, [filteredCategories, form.category_id])

  const selectedCategoryParsed = useMemo(() => {
    if (!selectedCategory) return { emoji: '🏷️', name: 'Pilih Kategori' }
    return extractCategoryEmojiAndName(selectedCategory.name, selectedCategory.type)
  }, [selectedCategory])

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type || 'expense',
        note: initialData.note || '',
        amount: initialData.amount || '',
        execution_day: initialData.execution_day || 1,
        wallet_id: initialData.wallet_id || wallets[0]?.id || '',
        to_wallet_id: initialData.to_wallet_id || '',
        category_id: initialData.category_id || '',
        is_active: initialData.is_active ?? true,
      })
    } else {
      const initialCat = categories.filter((c) => c.type === 'expense')[0]?.id || ''
      setForm({
        type: 'expense',
        note: '',
        amount: '',
        execution_day: 1,
        wallet_id: wallets[0]?.id || '',
        to_wallet_id: '',
        category_id: initialCat,
        is_active: true,
      })
    }
    if (isOpen) {
      setIsNumpadOpen(true)
    }
  }, [initialData, wallets, isOpen, categories])

  const amountColorClass = useMemo(() => {
    if (form.type === 'income') return 'text-emerald-600 dark:text-emerald-400'
    if (form.type === 'transfer') return 'text-blue-600 dark:text-blue-400'
    return 'text-orange-700 dark:text-orange-500' // expense
  }, [form.type])

  const handleTypeChange = (type) => {
    const available = categories.filter((c) => c.type === type)
    const nextToWallet =
      type === 'transfer'
        ? wallets.find((w) => w.id !== form.wallet_id)?.id || ''
        : ''

    setForm((prev) => ({
      ...prev,
      type,
      category_id: available[0]?.id || '',
      to_wallet_id: nextToWallet,
    }))
  }

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleSwapWallets = (e) => {
    e.stopPropagation()
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } catch (_) {}

    setForm((prev) => {
      const currentSource = prev.wallet_id
      const currentDest = prev.to_wallet_id || wallets.find((w) => w.id !== currentSource)?.id || ''
      return {
        ...prev,
        wallet_id: currentDest,
        to_wallet_id: currentSource,
      }
    })
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      if (!isDesktop) setIsNumpadOpen(true)
      return
    }
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      console.error('Failed to submit recurring transaction:', err)
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-4">
      {/* 1. Type Switcher (Pill Style) */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
        {TRANSACTION_TYPES.map((t) => {
          const isActive = form.type === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`flex-1 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 2. Nominal Input (Tengah - Typography Style like TransactionForm) */}
      <div
        onClick={() => {
          if (!isDesktop) setIsNumpadOpen(true)
        }}
        className="flex flex-col items-center justify-center py-2 sm:py-3 cursor-pointer group"
      >
        <div className="flex items-center justify-center gap-1.5">
          <span className={`text-3xl sm:text-4xl font-bold ${amountColorClass}`}>
            Rp
          </span>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            allowNegative={false}
            value={form.amount}
            onValueChange={(values) => {
              handleChange('amount', values.floatValue !== undefined ? values.floatValue : '')
            }}
            placeholder="0"
            readOnly={!isDesktop}
            inputMode={!isDesktop ? 'none' : 'numeric'}
            onFocus={(e) => {
              if (!isDesktop) {
                e.target.blur()
                setIsNumpadOpen(true)
              }
            }}
            onClick={() => {
              if (!isDesktop) setIsNumpadOpen(true)
            }}
            className={`w-auto max-w-[280px] sm:max-w-xs text-4xl sm:text-5xl font-bold bg-transparent border-0 outline-none p-0 text-center tracking-tight cursor-pointer ${amountColorClass} ${
              !isDesktop ? 'caret-transparent select-none focus:outline-none' : ''
            }`}
          />
          {/* Kursor biru vertikal */}
          <span className="w-0.5 h-8 sm:h-10 bg-blue-600 rounded-full animate-pulse ml-0.5" />
        </div>

        {/* Subtitle di bawah nominal */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          {form.type === 'transfer' ? (
            <>
              Transfer ke:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {selectedToWallet?.name || 'Pilih dompet tujuan'}
              </span>
            </>
          ) : (
            <>
              Kategori:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedCategoryParsed.name || 'Pilih Kategori'}
              </span>
            </>
          )}
        </p>
      </div>

      {/* 3. Category Chips (Scroll Horizontal - Expense & Income only) */}
      {form.type !== 'transfer' && (
        <div>
          <div className="flex overflow-x-auto scrollbar-hide gap-2 py-0.5 items-center">
            {/* Quick Button "Semua >" */}
            <button
              type="button"
              onClick={() => {
                setCategorySearch('')
                setCategoryDrawerOpen(true)
              }}
              className="rounded-full px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Category Pills */}
            {filteredCategories.map((cat) => {
              const isSelected = form.category_id === cat.id
              const { emoji, name: catName } = extractCategoryEmojiAndName(cat.name, cat.type)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleChange('category_id', cat.id)}
                  className={`rounded-full px-3.5 py-1.5 border flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm sm:text-base leading-none">{emoji}</span>
                  <span>{catName}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Blok Detail Grouped Card (Dompet, Tanggal Eksekusi, Nama, Status Aktif) */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
        {/* Baris 1 & 1b: Dompet (Transfer memiliki tombol switch/swap) */}
        <div className="relative divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* Dari Dompet */}
          <div
            onClick={() => {
              setWalletDrawerTarget('source')
              setWalletDrawerOpen(true)
            }}
            className="flex items-center justify-between p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <WalletIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {form.type === 'transfer' ? 'Dari Dompet' : 'Dompet'}
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {selectedWallet && (
                <BankItemIcon item={selectedWallet} size="sm" className="shadow-2xs" />
              )}
              <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[120px]">
                {selectedWallet?.name || 'Pilih dompet'}
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                IDR
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Tombol Switch / Swap Dompet (Hanya saat Transfer) */}
          {form.type === 'transfer' && (
            <div className="absolute right-[37px] top-1/2 -translate-y-1/2 z-20">
              <button
                type="button"
                onClick={handleSwapWallets}
                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 active:scale-90 active:rotate-180 transition-all duration-200 cursor-pointer"
                aria-label="Tukar dompet asal dan tujuan"
                title="Tukar pilihan dompet"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Baris 1b: Khusus Transfer -> Dompet Tujuan */}
          {form.type === 'transfer' && (
            <div
              onClick={() => {
                setWalletDrawerTarget('destination')
                setWalletDrawerOpen(true)
              }}
              className="flex items-center justify-between p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Ke Dompet
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {selectedToWallet && (
                  <BankItemIcon item={selectedToWallet} size="sm" className="shadow-2xs" />
                )}
                <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[120px]">
                  {selectedToWallet?.name || 'Pilih dompet'}
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  IDR
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Baris 2: Tanggal Eksekusi Bulanan */}
        <Popover open={dayPopoverOpen} onOpenChange={setDayPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-between p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Tanggal
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  Tanggal {form.execution_day} tiap bulan
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-3 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 z-[9999]"
            align="end"
            sideOffset={4}
          >
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Tanggal Eksekusi Bulanan
            </p>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = form.execution_day === day
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      handleChange('execution_day', day)
                      setDayPopoverOpen(false)
                    }}
                    className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A2C4C] text-white shadow-xs font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Baris 3: Nama Transaksi / Langganan */}
        <div className="flex items-center gap-3 p-3">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
            <Pencil className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Nama transaksi / langganan (Netflix, BPJS...)"
            className="w-full bg-transparent border-0 outline-none text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 py-0.5"
          />
        </div>

        {/* Baris 4: Status Aktif & Notifikasi */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white block leading-tight">
                Status Aktif & Notifikasi
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                {form.is_active
                  ? 'Pengingat notifikasi & pencatatan otomatis aktif'
                  : 'Transaksi dan pengingat dinonaktifkan sementara'}
              </span>
            </div>
          </div>

          <Switch
            checked={form.is_active}
            onCheckedChange={(checked) => handleChange('is_active', checked)}
          />
        </div>
      </div>

      {/* 5. Tombol Action (Batal & Simpan) */}
      <div className="flex items-center gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="rounded-full px-5 h-12 text-sm font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
        >
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          loading={loading}
          disabled={!form.amount || parseFloat(form.amount) <= 0}
          className="flex-1 rounded-full h-12 text-sm font-bold bg-[#1A2C4C] hover:bg-[#13223b] text-white shadow-md cursor-pointer disabled:opacity-40"
        >
          {initialData ? 'Simpan Perubahan' : 'Tambah Langganan'}
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Transaksi Rutin' : 'Tambah Transaksi Rutin'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Catat tagihan dan langganan bulanan otomatis
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">{formContent}</div>
          </DialogContent>
        </Dialog>

        {/* Desktop Drawer Pilih Dompet */}
        <Drawer open={walletDrawerOpen} onOpenChange={setWalletDrawerOpen}>
          <DrawerContent className="max-h-[85dvh] rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-[99999]">
            <DrawerHeader className="px-6 py-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {walletDrawerTarget === 'destination' ? 'Pilih dompet tujuan' : 'Pilih dompet'}
              </DrawerTitle>
              <DrawerClose asChild>
                <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </DrawerHeader>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-2">
              {wallets
                .filter((w) => {
                  if (form.type === 'transfer' && walletDrawerTarget === 'destination') {
                    return w.id !== form.wallet_id
                  }
                  return true
                })
                .map((w) => {
                  const currentSelectedId =
                    walletDrawerTarget === 'destination' ? form.to_wallet_id : form.wallet_id
                  const isChecked = currentSelectedId === w.id

                  return (
                    <div
                      key={w.id}
                      onClick={() => {
                        if (walletDrawerTarget === 'destination') {
                          handleChange('to_wallet_id', w.id)
                        } else {
                          handleChange('wallet_id', w.id)
                        }
                        setWalletDrawerOpen(false)
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <BankItemIcon item={w} size="md" className="shadow-2xs" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {w.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              IDR
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {formatCurrency(w.balance)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-xs">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Desktop Drawer Semua Kategori */}
        <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
          <DrawerContent className="max-h-[85dvh] rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-[99999]">
            <DrawerHeader className="px-6 py-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Pilih kategori
              </DrawerTitle>
              <DrawerClose asChild>
                <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </DrawerHeader>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Cari kategori..."
                  className="pl-9 pr-8 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-base focus-visible:ring-1 focus-visible:ring-[#1A2C4C]"
                  autoFocus
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchedCategories.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Tidak ada kategori "{categorySearch}"
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {searchedCategories.map((c) => {
                    const isSelected = form.category_id === c.id
                    const { emoji, name: catName } = extractCategoryEmojiAndName(c.name, c.type)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          handleChange('category_id', c.id)
                          setCategoryDrawerOpen(false)
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm truncate">{catName}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90dvh] flex flex-col border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Mobile Header: Left Close Button, Center Title, Right Spacer (Identical to TransactionModal) */}
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
              {initialData ? 'Edit transaksi rutin' : 'Tambah transaksi rutin'}
            </DrawerTitle>
            <div className="w-8 h-8" /> {/* spacer for perfect center */}
          </DrawerHeader>

          <div
            className={`flex-1 overflow-y-auto overscroll-contain px-4 pt-3 transition-all duration-200 ${
              isNumpadOpen ? 'pb-96' : 'pb-6'
            }`}
          >
            {formContent}
          </div>

          {/* Mobile Custom Calculator Numpad */}
          {isNumpadOpen && (
            <CustomNumpad
              isOpen={true}
              value={form.amount}
              onChange={(val) => handleChange('amount', val)}
              onClose={() => setIsNumpadOpen(false)}
              onSubmit={() => setIsNumpadOpen(false)}
            />
          )}
        </DrawerContent>
      </Drawer>

      {/* Drawer Pilih Dompet */}
      <Drawer open={walletDrawerOpen} onOpenChange={setWalletDrawerOpen}>
        <DrawerContent className="max-h-[85dvh] rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-[99999]">
          <DrawerHeader className="px-6 py-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {walletDrawerTarget === 'destination' ? 'Pilih dompet tujuan' : 'Pilih dompet'}
            </DrawerTitle>
            <DrawerClose asChild>
              <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-2">
            {wallets
              .filter((w) => {
                if (form.type === 'transfer' && walletDrawerTarget === 'destination') {
                  return w.id !== form.wallet_id
                }
                return true
              })
              .map((w) => {
                const currentSelectedId =
                  walletDrawerTarget === 'destination' ? form.to_wallet_id : form.wallet_id
                const isChecked = currentSelectedId === w.id

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      if (walletDrawerTarget === 'destination') {
                        handleChange('to_wallet_id', w.id)
                      } else {
                        handleChange('wallet_id', w.id)
                      }
                      setWalletDrawerOpen(false)
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <BankItemIcon item={w} size="md" className="shadow-2xs" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {w.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            IDR
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {formatCurrency(w.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isChecked ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-xs">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 transition-colors" />
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer Semua Kategori (Dengan Fitur Pencarian) */}
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DrawerContent className="max-h-[85dvh] rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-[99999]">
          <DrawerHeader className="px-6 py-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Pilih kategori
            </DrawerTitle>
            <DrawerClose asChild>
              <button type="button" className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Cari kategori..."
                className="pl-9 pr-8 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-base focus-visible:ring-1 focus-visible:ring-[#1A2C4C]"
                autoFocus
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchedCategories.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Tidak ada kategori "{categorySearch}"
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {searchedCategories.map((c) => {
                  const isSelected = form.category_id === c.id
                  const { emoji, name: catName } = extractCategoryEmojiAndName(c.name, c.type)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleChange('category_id', c.id)
                        setCategoryDrawerOpen(false)
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm truncate">{catName}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
