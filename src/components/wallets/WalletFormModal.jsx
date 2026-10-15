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
import { NumericFormat } from 'react-number-format'

const WALLET_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'savings', label: 'Savings' },
]

export default function WalletFormModal({ isOpen, onClose, onSubmit, editingWallet = null }) {
  const isEditing = !!editingWallet
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'cash',
    balance: '',
    annual_interest_rate: '',
    interest_payout_date: '',
  })

  useEffect(() => {
    if (editingWallet) {
      setForm({
        name: editingWallet.name || '',
        type: editingWallet.type || 'cash',
        balance: editingWallet.balance?.toString() || '0',
        annual_interest_rate: editingWallet.annual_interest_rate ? editingWallet.annual_interest_rate.toString() : '',
        interest_payout_date: editingWallet.interest_payout_date ? editingWallet.interest_payout_date.toString() : '',
      })
    } else {
      setForm({
        name: '',
        type: 'cash',
        balance: '',
        annual_interest_rate: '',
        interest_payout_date: '',
      })
    }
  }, [editingWallet, isOpen])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        balance: parseFloat(form.balance) || 0,
        annual_interest_rate: form.annual_interest_rate ? parseFloat(form.annual_interest_rate) : 0,
        interest_payout_date: form.interest_payout_date ? parseInt(form.interest_payout_date, 10) : null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save wallet:', err)
    } finally {
      setLoading(false)
    }
  }

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
              className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
            />
          </div>
        )}

        {/* Interest & Payout Date Fields (APR % and Payout Date 1-31) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
              <SelectContent className="rounded-xl bg-white shadow-xl border-slate-200 max-h-56 z-70">
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
