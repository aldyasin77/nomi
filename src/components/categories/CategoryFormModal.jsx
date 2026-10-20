import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import SegmentedControl from '../ui/SegmentedControl'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NumericFormat } from 'react-number-format'
import { Plus, Search, Check, Smile } from 'lucide-react'

const CATEGORY_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

const COLOR_SWATCHES = [
  { name: 'Red', hex: '#EF4444', ring: 'ring-red-400' },
  { name: 'Orange', hex: '#F97316', ring: 'ring-orange-400' },
  { name: 'Amber', hex: '#F59E0B', ring: 'ring-amber-400' },
  { name: 'Green', hex: '#10B981', ring: 'ring-emerald-400' },
  { name: 'Teal', hex: '#06B6D4', ring: 'ring-cyan-400' },
  { name: 'Blue', hex: '#3B82F6', ring: 'ring-blue-400' },
  { name: 'Indigo', hex: '#6366F1', ring: 'ring-indigo-400' },
  { name: 'Purple', hex: '#A855F7', ring: 'ring-purple-400' },
  { name: 'Pink', hex: '#EC4899', ring: 'ring-pink-400' },
]

const POPULAR_EMOJIS = [
  '🍔', '🍕', '🍜', '☕', '🍱', '🍦', '🥗', '🍰',
  '🚗', '✈️', '⛽', '🚕', '🚌', '🚲', '🚆', '🛴',
  '💡', '⚡', '🔧', '🏠', '📱', '🌐', '💧', '🛋️',
  '👨‍👩‍👧', '🎁', '👶', '🐶', '🐱', '❤️', '🤲', '🎉',
  '📚', '🎓', '💻', '✏️', '🎒', '🏢', '💼', '📌',
  '🏥', '💊', '🚨', '🏋️‍♀️', '🩺', '🏃', '🧘', '🩹',
  '🛍️', '👗', '👟', '🎮', '🎬', '🎟️', '💈', '💄',
  '💰', '💵', '📈', '🏦', '💎', '🪙', '🧧', '🧾',
]

import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

export default function CategoryFormModal({ isOpen, onClose, onSubmit, editingCategory = null }) {
  const isEditing = !!editingCategory
  const [loading, setLoading] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('🍔')
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[5].hex) // Default blue
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false)
  const [searchEmoji, setSearchEmoji] = useState('')

  const [form, setForm] = useState({
    name: '',
    type: 'expense',
    monthly_limit: '',
  })

  useEffect(() => {
    if (editingCategory) {
      const { emoji, name } = extractCategoryEmojiAndName(editingCategory.name || '', editingCategory.type)
      setSelectedEmoji(emoji || '🏷️')
      setSelectedColor(editingCategory.color || COLOR_SWATCHES[5].hex)
      setForm({
        name: name || '',
        type: editingCategory.type || 'expense',
        monthly_limit: editingCategory.monthly_limit?.toString() || '',
      })
    } else {
      setSelectedEmoji('🍔')
      setSelectedColor(COLOR_SWATCHES[5].hex)
      setForm({
        name: '',
        type: 'expense',
        monthly_limit: '',
      })
    }
  }, [editingCategory, isOpen])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const trimmedName = form.name.trim()
      // Include selected emoji in category name for universal display
      const finalName = selectedEmoji ? `${selectedEmoji} ${trimmedName}` : trimmedName

      await onSubmit({
        name: finalName,
        type: form.type,
        monthly_limit: form.type === 'expense' && form.monthly_limit ? parseFloat(form.monthly_limit) : 0,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save category:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmojis = searchEmoji
    ? POPULAR_EMOJIS // Simple search fallback
    : POPULAR_EMOJIS

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add Categories'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subtitle matching design reference */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
          <p className="text-xs font-semibold text-slate-800">
            {isEditing ? 'Update Kategori' : 'Add a New Category'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Nomi will use it to better understand your financial habits and help you make smarter decisions.
          </p>
        </div>

        {/* Type Segmented Control */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Type of Category
          </label>
          <SegmentedControl
            options={CATEGORY_TYPES}
            value={form.type}
            onChange={(value) => handleChange('type', value)}
          />
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Name
          </label>
          <Input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Coffee runs, Groceries, Gym"
            className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
        </div>

        {/* Monthly Limit (expense only) */}
        {form.type === 'expense' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Limit Bulanan (Monthly Limit)
            </label>
            <NumericFormat
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              allowNegative={false}
              value={form.monthly_limit}
              onValueChange={(values) => {
                handleChange('monthly_limit', values.floatValue !== undefined ? values.floatValue : '')
              }}
              placeholder="Rp 0"
              customInput={Input}
              inputMode="numeric"
              className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Opsional: Tentukan batas anggaran bulanan untuk kategori ini
            </p>
          </div>
        )}

        {/* Emoji & Colors Section (Matching Reference Visual) */}
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-semibold text-slate-700">
            Emoji & Colors
          </label>

          {/* Emoji Trigger */}
          <div className="flex items-center gap-3">
            <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white flex items-center justify-center text-2xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {selectedEmoji ? selectedEmoji : <Plus size={18} className="text-slate-400" />}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 bg-white shadow-2xl rounded-2xl border border-slate-200 z-70"
                align="start"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Select Emoji</span>
                    <span className="text-[10px] text-slate-400">Pilih ikon</span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchEmoji}
                      onChange={(e) => setSearchEmoji(e.target.value)}
                      placeholder="Cari emoji..."
                      className="w-full h-8 pl-8 pr-3 text-base sm:text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Emoji Grid */}
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto py-1">
                    {filteredEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setEmojiPopoverOpen(false)
                        }}
                        className={`
                          w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 transition-all cursor-pointer
                          ${selectedEmoji === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-105' : ''}
                        `}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
              <span className="px-3 py-1 bg-white rounded-lg shadow-xs font-semibold text-slate-800">
                Emoji
              </span>
              <span className="px-3 py-1 text-slate-400">
                3D Icon
              </span>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Colors</span>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = selectedColor === swatch.hex
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setSelectedColor(swatch.hex)}
                    style={{ backgroundColor: swatch.hex }}
                    className={`
                      w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer active:scale-90
                      ${isSelected ? 'ring-3 ring-offset-2 ring-slate-400 scale-110 shadow-md' : 'opacity-85 hover:opacity-100'}
                    `}
                    aria-label={swatch.name}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow-xs" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3">
          <Button
            type="submit"
            loading={loading}
            className="w-full h-12 text-sm font-bold bg-[#1A2C4C] hover:bg-[#13223b] text-white rounded-2xl shadow-md cursor-pointer"
          >
            {isEditing ? 'Save Changes' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
