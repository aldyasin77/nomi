import { useState, useEffect, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import Button from '@/components/ui/Button'
import { NumericFormat } from 'react-number-format'
import { THEME_OPTIONS, detectTheme } from '@/data/walletThemes'
import {
  WALLET_GROUPS,
  ALL_WALLET_ITEMS,
  resolveBankLogo,
  detectBankLogo,
} from '@/data/bankLogos'
import BankItemIcon from './BankItemIcon'
import CustomNumpad from '@/components/common/CustomNumpad'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Search,
  ArrowLeft,
  X,
  Wallet,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

// Dropdown options for 'Tipe dompet'
const WALLET_TYPE_OPTIONS = [
  {
    value: 'savings',
    label: 'Tabungan',
    description: 'Rekening bank atau tabungan utama',
  },
  {
    value: 'e-wallet',
    label: 'E-wallet',
    description: 'Dompet digital untuk transaksi harian',
  },
  {
    value: 'investment',
    label: 'Investasi',
    description: 'Reksa dana, saham, atau aset investasi',
  },
  {
    value: 'cash',
    label: 'Tunai',
    description: 'Uang kas fisik di dompet',
  },
]

export default function WalletFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingWallet = null,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isEditing = Boolean(editingWallet)

  // Step 1: Bank Selection, Step 2: Form Detail
  const [step, setStep] = useState(isEditing ? 2 : 1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isNumpadOpen, setIsNumpadOpen] = useState(false)
  const [isInterestEnabled, setIsInterestEnabled] = useState(false)

  const [form, setForm] = useState({
    name: '',
    type: 'savings',
    balance: '',
    annual_interest_rate: '',
    interest_payout_date: '',
    card_theme: 'aurora',
    bank_logo: '',
  })

  // Synchronize state on open / edit
  useEffect(() => {
    if (editingWallet) {
      setStep(2)
      const hasInterest = Boolean(
        (editingWallet.annual_interest_rate &&
          parseFloat(editingWallet.annual_interest_rate) > 0) ||
          editingWallet.interest_payout_date
      )
      setIsInterestEnabled(hasInterest)
      setShowAdvanced(hasInterest)

      const existingLogo = resolveBankLogo(editingWallet.bank_logo)
      const matchedItem = ALL_WALLET_ITEMS.find(
        (item) =>
          item.file === existingLogo ||
          item.name.toLowerCase() === editingWallet.name?.toLowerCase()
      )
      setSelectedItem(
        matchedItem || {
          name: editingWallet.name,
          file: existingLogo,
          code: existingLogo?.replace(/\.(png|svg)$/i, ''),
        }
      )

      setForm({
        name: editingWallet.name || '',
        type: editingWallet.type || 'savings',
        balance: editingWallet.balance?.toString() || '0',
        annual_interest_rate: editingWallet.annual_interest_rate
          ? editingWallet.annual_interest_rate.toString()
          : '',
        interest_payout_date: editingWallet.interest_payout_date
          ? editingWallet.interest_payout_date.toString()
          : '',
        card_theme:
          editingWallet.card_theme || detectTheme(editingWallet.name || ''),
        bank_logo: existingLogo || '',
      })
    } else {
      setStep(1)
      setSearchQuery('')
      setSelectedItem(null)
      setIsInterestEnabled(false)
      setShowAdvanced(false)
      setForm({
        name: '',
        type: 'savings',
        balance: '',
        annual_interest_rate: '',
        interest_payout_date: '',
        card_theme: 'aurora',
        bank_logo: '',
      })
    }
  }, [editingWallet, isOpen])

  // Filter items in step 1 based on search query
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return WALLET_GROUPS

    return WALLET_GROUPS.map((group) => {
      const matchedItems = group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.logoId?.toLowerCase().includes(query) ||
          item.code?.toLowerCase().includes(query) ||
          group.category.toLowerCase().includes(query)
      )
      return {
        ...group,
        items: matchedItems,
      }
    }).filter((group) => group.items.length > 0)
  }, [searchQuery])

  // Handle bank/item selection in Step 1
  const handleSelectBank = (item) => {
    setSelectedItem(item)
    const detectedType = item.defaultType || 'savings'
    const detectedCardTheme = detectTheme(item.name)

    setForm((prev) => ({
      ...prev,
      name: item.name,
      type: detectedType,
      bank_logo: item.logoId || item.file || `${item.code}.png`,
      card_theme: detectedCardTheme,
    }))

    // Advance to Step 2
    setStep(2)
  }

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name') {
        if (!prev._themeManuallySet) {
          next.card_theme = detectTheme(value)
        }
        if (!prev._bankLogoManuallySet) {
          const detected = detectBankLogo(value)
          if (detected) {
            next.bank_logo = detected
          }
        }
      }
      return next
    })
  }

  const handleInterestToggle = (checked) => {
    setIsInterestEnabled(checked)
    if (!checked) {
      setForm((prev) => ({
        ...prev,
        annual_interest_rate: '',
        interest_payout_date: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        balance: parseFloat(form.balance) || 0,
        annual_interest_rate:
          isInterestEnabled && form.annual_interest_rate
            ? parseFloat(form.annual_interest_rate)
            : 0,
        interest_payout_date:
          isInterestEnabled && form.interest_payout_date
            ? parseInt(form.interest_payout_date, 10)
            : null,
        card_theme: form.card_theme || 'aurora',
        bank_logo: form.bank_logo || null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  // Render Step 1: Layar Pemilihan Bank (Bank Selection)
  const renderStep1 = () => (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari bank atau e-wallet..."
          className="h-11 pl-10 pr-9 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-base focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C] placeholder:text-slate-400"
          autoFocus={!isEditing}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Grouped Bank/E-Wallet List */}
      <div className="max-h-[52vh] sm:max-h-[58vh] overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tidak ditemukan bank atau e-wallet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              "{searchQuery}" tidak ada di daftar. Kamu bisa membuatnya secara manual.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4 text-xs"
              onClick={() => {
                handleSelectBank({
                  name: searchQuery,
                  file: null,
                  code: 'custom',
                  defaultType: 'savings',
                })
              }}
            >
              Gunakan nama "{searchQuery}"
            </Button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.category} className="space-y-3">
              {/* Category Header with Divider */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase shrink-0">
                  {group.category}
                </span>
                <Separator className="flex-1" />
              </div>

              {/* 4-Column Grid of Circular Buttons */}
              <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {group.items.map((item) => (
                  <button
                    key={item.id || item.code}
                    type="button"
                    onClick={() => handleSelectBank(item)}
                    className="group flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 active:scale-95 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A2C4C]/40"
                  >
                    <BankItemIcon
                      item={item}
                      size="md"
                      className="group-hover:scale-105 group-hover:shadow-md transition-all duration-200"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white group-hover:font-semibold">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // Render Step 2: Layar Form Detail Dompet
  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {/* Navigation Header for Step 2 */}
      {!isEditing && (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Ganti bank atau e-wallet</span>
        </button>
      )}

      {/* Bank Logo & Wallet Name Field */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Nama dompet
        </label>
        <div className="flex items-center gap-2.5">
          {/* Selected Bank Logo on the Left */}
          <div
            onClick={() => !isEditing && setStep(1)}
            className={`shrink-0 ${!isEditing ? 'cursor-pointer hover:opacity-85' : ''}`}
            title={!isEditing ? 'Klik untuk mengganti bank' : ''}
          >
            <BankItemIcon
              item={
                selectedItem || {
                  name: form.name || 'Bank',
                  file: form.bank_logo,
                  code: form.bank_logo?.replace(/\.(png|svg)$/i, ''),
                }
              }
              size="md"
            />
          </div>

          {/* Wallet Name Input */}
          <Input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Contoh: BCA Utama, GoPay Harian"
            className="h-12 px-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>
      </div>

      {/* Wallet Type Select */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Tipe dompet
        </label>
        <Select
          value={form.type}
          onValueChange={(val) => handleChange('type', val)}
        >
          <SelectTrigger className="min-h-[52px] h-auto w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
            <SelectValue placeholder="Pilih tipe dompet..." />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-2xl !bg-white dark:!bg-slate-900 bg-white shadow-2xl border border-slate-200 dark:border-slate-800 max-h-64 z-[9999]"
          >
            {WALLET_TYPE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer py-2 px-3 focus:bg-slate-100 dark:focus:bg-slate-800"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Saldo Saat Ini Field with Large 'Rp' Prefix */}
      <div className="pt-1">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Saldo saat ini
        </label>
        <div
          onClick={() => setIsNumpadOpen(true)}
          className="relative flex items-center rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-4 py-2.5 focus-within:border-[#1A2C4C] dark:focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-[#1A2C4C]/10 transition-all cursor-pointer"
        >
          <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 mr-2 select-none">
            Rp
          </span>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            allowNegative={false}
            value={form.balance}
            onValueChange={(values) => {
              handleChange('balance', values.floatValue !== undefined ? values.floatValue : '')
            }}
            placeholder="0"
            readOnly={!isDesktop}
            inputMode={!isDesktop ? 'none' : 'numeric'}
            autoComplete="off"
            onFocus={(e) => {
              if (!isDesktop) {
                e.target.blur()
                setIsNumpadOpen(true)
              }
            }}
            onClick={() => setIsNumpadOpen(true)}
            className={`w-full text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white bg-transparent border-0 outline-none p-0 tracking-tight placeholder:text-slate-300 dark:placeholder:text-slate-600 cursor-pointer sm:cursor-text ${
              !isDesktop ? 'caret-transparent select-none focus:outline-none' : ''
            }`}
          />
        </div>
      </div>

      {/* Collapsible Advanced Settings: Card Theme & Interest */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pengaturan Tambahan (Tema & Bunga)
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-2.5 animate-fade-in border-t border-slate-100 dark:border-slate-800">
            {/* Card Theme Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Tema Kartu
              </label>
              <Select
                value={form.card_theme}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, card_theme: val, _themeManuallySet: true }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
                  <SelectValue placeholder="Pilih tema kartu..." />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl !bg-white dark:!bg-slate-900 bg-white shadow-xl border border-slate-200 dark:border-slate-800 max-h-52 z-[9999]"
                >
                  {THEME_OPTIONS.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value} className="cursor-pointer text-xs">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-md shrink-0 shadow-sm"
                          style={{ background: theme.gradient }}
                        />
                        <span>{theme.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interest Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <label htmlFor="interest-switch" className="text-xs font-semibold text-slate-800 dark:text-slate-200 block cursor-pointer">
                    Aktifkan Bunga Simpanan
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Hitung dan catat bunga otomatis untuk dompet ini
                  </p>
                </div>
                <Switch
                  id="interest-switch"
                  checked={isInterestEnabled}
                  onCheckedChange={handleInterestToggle}
                />
              </div>

              {isInterestEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bunga Tahunan / APR (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      inputMode="decimal"
                      value={form.annual_interest_rate}
                      onChange={(e) => handleChange('annual_interest_rate', e.target.value)}
                      placeholder="Contoh: 4.5"
                      className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Pencairan
                    </label>
                    <Select
                      value={form.interest_payout_date}
                      onValueChange={(val) => handleChange('interest_payout_date', val)}
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base">
                        <SelectValue placeholder="Pilih tanggal..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 z-[9999] bg-white dark:bg-slate-900">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()} className="text-xs">
                            Tanggal {day} tiap bulan
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Main Button: Tambah Dompet */}
      <div className="pt-3">
        <Button
          type="submit"
          loading={loading}
          disabled={!form.name.trim()}
          className="w-full h-12 rounded-2xl bg-[#1A2C4C] hover:bg-[#13223b] text-white font-semibold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah dompet'}
        </Button>
      </div>
    </form>
  )

  // Title and subtitle logic based on current step
  const modalTitle = step === 1 ? 'Pilih Bank atau E-Wallet' : (isEditing ? 'Edit Dompet' : 'Detail Dompet')
  const modalSubtitle = step === 1
    ? 'Pilih penyedia layanan keuangan untuk dompet barumu'
    : (isEditing ? 'Perbarui informasi dompetmu' : 'Atur nama, tipe, dan saldo awal dompet')

  // Responsive modal rendering: Dialog for Desktop, Drawer for Mobile
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader className="mb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white text-left">
                  {modalTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 text-left mt-0.5">
                  {modalSubtitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-0.5">
            {step === 1 ? renderStep1() : renderStep2()}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile Bottom Sheet Drawer
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[88dvh] rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        contentWrapperClassName="relative flex-1 flex flex-col overflow-hidden p-0 pb-0"
      >
        <DrawerHeader className="flex flex-row items-center justify-between px-6 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white text-left">
              {modalTitle}
            </DrawerTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-left">
              {modalSubtitle}
            </p>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className={`flex-1 overflow-y-auto px-6 py-4 transition-all duration-200 ${isNumpadOpen ? 'max-md:pb-[300px]' : 'max-md:pb-4'} md:pb-4`}>
          {step === 1 ? renderStep1() : renderStep2()}
        </div>

        {/* Mobile Custom Calculator Numpad (di luar area scroll form) */}
        {isNumpadOpen && (
          <div className="md:hidden">
            <CustomNumpad
              isOpen={true}
              value={form.balance}
              onChange={(val) => handleChange('balance', val)}
              onClose={() => setIsNumpadOpen(false)}
              onSubmit={() => setIsNumpadOpen(false)}
            />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
