import React, { useState, useEffect } from 'react'
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
  DrawerDescription,
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
import Button from '@/components/ui/Button'
import SegmentedControl from '@/components/ui/SegmentedControl'

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'transfer', label: 'Transfer' },
]

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
      setForm({
        type: 'expense',
        note: '',
        amount: '',
        execution_day: 1,
        wallet_id: wallets[0]?.id || '',
        to_wallet_id: '',
        category_id: '',
        is_active: true,
      })
    }
  }, [initialData, wallets, isOpen])

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
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

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const formContent = (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Type Segmented Control */}
      <SegmentedControl
        options={TRANSACTION_TYPES}
        value={form.type}
        onChange={(val) => handleChange('type', val)}
      />

      {/* Note / Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nama Transaksi / Langganan
        </label>
        <Input
          type="text"
          required
          value={form.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Contoh: Netflix, Spotify, BPJS, Kosan"
          className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
        />
      </div>

      {/* Amount with NumericFormat */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nominal / Biaya
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
          inputMode="numeric"
          className="h-12 text-xl font-bold text-center border-slate-200 rounded-2xl bg-slate-50/70 shadow-inner focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
        />
      </div>

      {/* Execution Day (1 - 31) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Tanggal Eksekusi Bulanan
        </label>
        <Select
          value={form.execution_day.toString()}
          onValueChange={(val) => handleChange('execution_day', parseInt(val, 10))}
        >
          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
            <SelectValue placeholder="Pilih tanggal eksekusi..." />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl bg-white shadow-xl border-slate-200 max-h-56 z-[9999]"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()} className="cursor-pointer">
                Tanggal {day} tiap bulan
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-slate-400 mt-1">
          Jadwal cair/terpotong otomatis setiap tanggal ini
        </p>
      </div>

      {/* Wallet (Source) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {form.type === 'transfer' ? 'Dari Kantong Asal' : 'Kantong / Dompet'}
        </label>
        <Select
          value={form.wallet_id}
          onValueChange={(val) => handleChange('wallet_id', val)}
        >
          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
            <SelectValue placeholder="Pilih dompet..." />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl bg-white shadow-xl border-slate-200 z-[9999]"
          >
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id} className="cursor-pointer">
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Destination Wallet (if Transfer) */}
      {form.type === 'transfer' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ke Kantong Tujuan
          </label>
          <Select
            value={form.to_wallet_id}
            onValueChange={(val) => handleChange('to_wallet_id', val)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
              <SelectValue placeholder="Pilih dompet tujuan..." />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl bg-white shadow-xl border-slate-200 z-[9999]"
            >
              {wallets
                .filter((w) => w.id !== form.wallet_id)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id} className="cursor-pointer">
                    {w.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category (if not transfer) */}
      {form.type !== 'transfer' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kategori
          </label>
          <Select
            value={form.category_id}
            onValueChange={(val) => handleChange('category_id', val)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-base focus:ring-[#1A2C4C]/20 focus:border-[#1A2C4C]">
              <SelectValue placeholder="Pilih kategori..." />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="w-(--radix-select-trigger-width) min-w-(--radix-select-trigger-width) rounded-xl bg-white shadow-xl border-slate-200 z-[9999]"
            >
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Toggle Status (is_active with Switch) */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">Status Aktif & Notifikasi</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {form.is_active
              ? 'Pengingat notifikasi & pencatatan otomatis aktif'
              : 'Transaksi dan pengingat dinonaktifkan sementara'}
          </p>
        </div>
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => handleChange('is_active', checked)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-3">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Batal
        </Button>
        <Button type="submit" loading={loading} className="flex-1 bg-[#1A2C4C] text-white">
          {initialData ? 'Simpan Perubahan' : 'Tambah Langganan'}
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? 'Edit Transaksi Rutin' : 'Tambah Transaksi Rutin'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Catat tagihan dan langganan bulanan otomatis
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">{formContent}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-3xl max-h-[85dvh] flex flex-col border-slate-200 shadow-2xl">
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
          <DrawerHeader className="text-left px-0 pb-3 border-b border-slate-100">
            <DrawerTitle className="text-lg font-bold text-slate-900 tracking-tight">
              {initialData ? 'Edit Transaksi Rutin' : 'Tambah Transaksi Rutin'}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-slate-500">
              Catat tagihan dan langganan bulanan otomatis
            </DrawerDescription>
          </DrawerHeader>
          <div className="pt-3">{formContent}</div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
