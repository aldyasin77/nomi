import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import SegmentedControl from '../ui/SegmentedControl'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { NumericFormat } from 'react-number-format'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
]

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  wallets = [],
  categories = [],
  initialTab = 'expense',
  initialType,
}) {
  const [loading, setLoading] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    wallet_id: '',
    to_wallet_id: '',
    category_id: '',
    note: '',
  })

  // Sync initial tab/type when opening modal
  useEffect(() => {
    if (isOpen) {
      const activeType = initialTab || initialType || 'expense'
      setForm(prev => ({
        ...prev,
        type: activeType,
        wallet_id: prev.wallet_id || (wallets[0]?.id || ''),
      }))
    }
  }, [isOpen, initialTab, initialType, wallets])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      type,
      category_id: '',
      to_wallet_id: '',
    }))
  }

  const handleDateSelect = (date) => {
    if (!date) return
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    handleChange('transaction_date', `${yyyy}-${mm}-${dd}`)
    setDatePopoverOpen(false)
  }

  // Filter categories by transaction type
  const filteredCategories = categories.filter(c => {
    if (form.type === 'income') return c.type === 'income'
    if (form.type === 'expense') return c.type === 'expense'
    return false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numericAmount = parseFloat(form.amount)
    if (!numericAmount || numericAmount <= 0) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        type: form.type,
        amount: numericAmount,
        transaction_date: form.transaction_date,
        wallet_id: form.wallet_id || null,
        category_id: form.type !== 'transfer' ? (form.category_id || null) : null,
        to_wallet_id: form.type === 'transfer' ? (form.to_wallet_id || null) : null,
        note: form.note ? form.note.trim() : null,
      }
      await onSubmit(payload)
      // Reset form
      setForm({
        type: initialTab || initialType || 'expense',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        wallet_id: wallets[0]?.id || '',
        to_wallet_id: '',
        category_id: '',
        note: '',
      })
      onClose()
    } catch (err) {
      console.error('Failed to save transaction:', err)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = form.transaction_date
    ? new Date(form.transaction_date + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Pilih Tanggal'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        form.type === 'transfer'
          ? 'Transfer Dana'
          : form.type === 'income'
          ? 'Tambah Pemasukan'
          : 'Tambah Pengeluaran'
      }
      subtitle="Catat aktivitas keuanganmu dengan mudah"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Segmented Control */}
        <SegmentedControl
          options={TRANSACTION_TYPES}
          value={form.type}
          onChange={handleTypeChange}
        />

        {/* Amount with Thousand Separator (react-number-format) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nominal / Amount
          </label>
          <NumericFormat
            thousandSeparator="."
            decimalSeparator=","
            prefix="Rp "
            allowNegative={false}
            value={form.amount}
            onValueChange={(values) => {
              handleChange('amount', values.floatValue !== undefined ? values.floatValue : '')
            }}
            placeholder="Rp 0"
            required
            customInput={Input}
            className="h-13 text-2xl font-bold text-center border-slate-200 rounded-2xl bg-slate-50/70 shadow-inner focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>

        {/* Date using Popover + Calendar (Fix double calendar icon) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Tanggal Transaksi
          </label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#1A2C4C]/20 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#1A2C4C]">
                    <CalendarIcon size={15} />
                  </div>
                  <span>{formattedDate}</span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 bg-white shadow-2xl rounded-2xl border border-slate-200 z-70"
              align="center"
              sideOffset={6}
            >
              <Calendar
                mode="single"
                selected={form.transaction_date ? new Date(form.transaction_date + 'T00:00:00') : new Date()}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Wallet (Source) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            {form.type === 'transfer' ? 'Dari Kantong / Wallet Asal' : 'Kantong / Wallet'}
          </label>
          <Select
            value={form.wallet_id}
            onValueChange={(val) => handleChange('wallet_id', val)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
              <SelectValue placeholder="Pilih dompet..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white shadow-xl border-slate-200 z-70">
              {wallets.map(w => (
                <SelectItem key={w.id} value={w.id} className="cursor-pointer">
                  {w.name} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(w.balance)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Destination Wallet (Transfer only) */}
        {form.type === 'transfer' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ke Kantong / Wallet Tujuan
            </label>
            <Select
              value={form.to_wallet_id}
              onValueChange={(val) => handleChange('to_wallet_id', val)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
                <SelectValue placeholder="Pilih dompet tujuan..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white shadow-xl border-slate-200 z-70">
                {wallets
                  .filter(w => w.id !== form.wallet_id)
                  .map(w => (
                    <SelectItem key={w.id} value={w.id} className="cursor-pointer">
                      {w.name} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(w.balance)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category (Income/Expense only) */}
        {form.type !== 'transfer' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kategori
            </label>
            <Select
              value={form.category_id}
              onValueChange={(val) => handleChange('category_id', val)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white shadow-xl border-slate-200 z-70">
                {filteredCategories.map(c => {
                  const { emoji, name: cleanName } = extractCategoryEmojiAndName(c.name, c.type)
                  return (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <span>{cleanName}</span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Catatan (Opsional)
          </label>
          <Input
            type="text"
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="Contoh: Makan siang bareng tim"
            className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  )
}
