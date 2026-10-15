import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '@/components/ui/input'
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
  })

  useEffect(() => {
    if (editingWallet) {
      setForm({
        name: editingWallet.name || '',
        type: editingWallet.type || 'cash',
        balance: editingWallet.balance?.toString() || '0',
        annual_interest_rate: editingWallet.annual_interest_rate?.toString() || '0',
      })
    } else {
      setForm({
        name: '',
        type: 'cash',
        balance: '',
        annual_interest_rate: '',
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
        annual_interest_rate: form.type === 'savings' ? (parseFloat(form.annual_interest_rate) || 0) : 0,
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
    >
      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Wallet Name</label>
          <Input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., BCA, GoPay, Cash Pocket"
            className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {WALLET_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('type', type.value)}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border
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

        {/* Balance */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Balance</label>
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

        {/* APR (only for savings) */}
        {form.type === 'savings' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Annual Interest Rate (APR %)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.annual_interest_rate}
              onChange={(e) => handleChange('annual_interest_rate', e.target.value)}
              placeholder="e.g., 4.5"
              className="h-11 px-4 rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
            />
            <p className="text-xs text-slate-400 mt-1">
              Used for daily interest projection on your card.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? 'Save Changes' : 'Add Wallet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
