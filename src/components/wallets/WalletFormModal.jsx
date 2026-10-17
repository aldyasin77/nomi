import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { NumericFormat } from 'react-number-format'
import { THEME_OPTIONS, detectTheme } from '@/data/walletThemes'
import { BANK_LOGOS, resolveBankLogo, detectBankLogo } from '@/data/bankLogos'
import { Wallet } from 'lucide-react'

const WALLET_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'savings', label: 'Savings' },
]

export default function WalletFormModal({ isOpen, onClose, onSubmit, editingWallet = null }) {
  const isEditing = !!editingWallet
  const [loading, setLoading] = useState(false)
  const [isInterestEnabled, setIsInterestEnabled] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'cash',
    balance: '',
    annual_interest_rate: '',
    interest_payout_date: '',
    card_theme: 'aurora',
    bank_logo: '',
  })

  useEffect(() => {
    if (editingWallet) {
      const hasInterest = Boolean(
        (editingWallet.annual_interest_rate && parseFloat(editingWallet.annual_interest_rate) > 0) ||
        editingWallet.interest_payout_date
      )
      setIsInterestEnabled(hasInterest)
      setForm({
        name: editingWallet.name || '',
        type: editingWallet.type || 'cash',
        balance: editingWallet.balance?.toString() || '0',
        annual_interest_rate: editingWallet.annual_interest_rate ? editingWallet.annual_interest_rate.toString() : '',
        interest_payout_date: editingWallet.interest_payout_date ? editingWallet.interest_payout_date.toString() : '',
        card_theme: editingWallet.card_theme || detectTheme(editingWallet.name || ''),
        bank_logo: resolveBankLogo(editingWallet.bank_logo) || '',
      })
    } else {
      setIsInterestEnabled(false)
      setForm({
        name: '',
        type: 'cash',
        balance: '',
        annual_interest_rate: '',
        interest_payout_date: '',
        card_theme: 'aurora',
        bank_logo: '',
      })
    }
  }, [editingWallet, isOpen])

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-detect theme & bank logo when name changes (if user hasn't manually set them)
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

  const handleThemeChange = (value) => {
    setForm(prev => ({ ...prev, card_theme: value, _themeManuallySet: true }))
  }

  const handleBankLogoChange = (value) => {
    setForm(prev => ({
      ...prev,
      bank_logo: value === 'none' ? '' : value,
      _bankLogoManuallySet: true,
    }))
  }

  const handleInterestToggle = (checked) => {
    setIsInterestEnabled(checked)
    if (!checked) {
      // Reset values when switch is turned off
      setForm(prev => ({
        ...prev,
        annual_interest_rate: '',
        interest_payout_date: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        balance: parseFloat(form.balance) || 0,
        annual_interest_rate: isInterestEnabled && form.annual_interest_rate ? parseFloat(form.annual_interest_rate) : 0,
        interest_payout_date: isInterestEnabled && form.interest_payout_date ? parseInt(form.interest_payout_date, 10) : null,
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

  // Find selected theme data for preview
  const selectedTheme = THEME_OPTIONS.find(t => t.value === form.card_theme)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Wallet' : 'Add New Wallet'}
      subtitle="Kelola rekening, kartu, atau kantong tabunganmu"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kantong / Wallet</label>
          <Input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Contoh: BCA Utama, GoPay, Tabungan Rumah"
            className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kantong</label>
          <div className="grid grid-cols-2 gap-2">
            {WALLET_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border
                  ${form.type === type.value
                    ? 'bg-[#1A2C4C] text-white border-[#1A2C4C] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pilih Bank / E-Wallet Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Pilih Bank / E-Wallet
          </label>
          <Select
            value={form.bank_logo || 'none'}
            onValueChange={handleBankLogoChange}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs sm:text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
              <SelectValue placeholder="Pilih bank atau e-wallet..." />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl !bg-white bg-white shadow-2xl border border-slate-200 max-h-56 z-[9999]"
            >
              {BANK_LOGOS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="cursor-pointer text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-0.5">
                      {opt.file ? (
                        <img
                          src={`/logos/${opt.file}`}
                          alt={opt.label}
                          className="h-4 w-auto max-w-[20px] object-contain"
                        />
                      ) : (
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-400 mt-1">
            Logo bank/e-wallet tersimpan ke kolom bank_logo dan muncul di pojok kiri atas kartu
          </p>
        </div>

        {/* Card Theme Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Tema Kartu</label>
          <Select
            value={form.card_theme}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs sm:text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
              <SelectValue placeholder="Pilih tema kartu..." />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl !bg-white bg-white shadow-2xl border border-slate-200 max-h-56 z-[9999]"
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
          <p className="text-[10px] text-slate-400 mt-1">
            Tema otomatis terdeteksi dari nama wallet. Bisa diganti manual.
          </p>
        </div>

        {/* Initial Balance */}
        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Awal</label>
            <NumericFormat
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              allowNegative={false}
              value={form.balance}
              onValueChange={(values) => {
                handleChange('balance', values.floatValue !== undefined ? values.floatValue : '')
              }}
              placeholder="Rp 0"
              customInput={Input}
              inputMode="numeric"
              className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
            />
          </div>
        )}

        {/* Toggle Aktifkan Bunga Simpanan (Switch) */}
        <div className="pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 transition-colors">
            <div className="pr-3">
              <label htmlFor="interest-switch" className="text-xs font-semibold text-slate-800 block cursor-pointer">
                Aktifkan Bunga Simpanan
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                Hitung dan catat bunga otomatis untuk kantong ini
              </p>
            </div>
            <Switch
              id="interest-switch"
              checked={isInterestEnabled}
              onCheckedChange={handleInterestToggle}
            />
          </div>

          {/* Conditional Rendering: Bunga Tahunan & Tanggal Pencairan */}
          {isInterestEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-fade-in">
              {/* Bunga Tahunan / APR (%) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Persentase bunga per tahun
                </p>
              </div>

              {/* Tanggal Pencairan Bunga (1-31) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pencairan Bunga
                </label>
                <Select
                  value={form.interest_payout_date}
                  onValueChange={(val) => handleChange('interest_payout_date', val)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs sm:text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
                    <SelectValue placeholder="Pilih tanggal (1-31)..." />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl !bg-white bg-white shadow-xl border-slate-200 max-h-56 z-[9999]"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()} className="cursor-pointer text-xs">
                        Tanggal {day} tiap bulan
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Jadwal pencairan tiap bulan
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading} className="flex-1 bg-[#1A2C4C] text-white">
            {isEditing ? 'Simpan Perubahan' : 'Tambah Kantong'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
