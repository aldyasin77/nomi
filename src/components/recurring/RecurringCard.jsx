import React from 'react'
import {
  CalendarClock,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Wallet,
  Bell,
  BellOff,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function RecurringCard({
  item,
  wallets = [],
  categories = [],
  onEdit,
  onDelete,
  onToggle,
}) {
  const wallet = wallets.find((w) => w.id === item.wallet_id)
  const category = categories.find((c) => c.id === item.category_id)

  const normalizedType = (() => {
    const raw = String(item.type || 'expense').toLowerCase().trim()
    if (raw === 'pengeluaran') return 'expense'
    if (raw === 'pemasukan') return 'income'
    if (raw === 'transfer') return 'transfer'
    return raw
  })()

  const typeConfig = {
    expense: {
      label: 'Pengeluaran',
      icon: TrendingDown,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-100/80',
      amountSign: '- ',
      amountColor: 'text-rose-600',
    },
    income: {
      label: 'Pemasukan',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-100/80',
      amountSign: '+ ',
      amountColor: 'text-emerald-600',
    },
    transfer: {
      label: 'Transfer',
      icon: ArrowLeftRight,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-100/80',
      amountSign: '',
      amountColor: 'text-indigo-900',
    },
  }[normalizedType] || {
    label: 'Pengeluaran',
    icon: TrendingDown,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-100/80',
    amountSign: '- ',
    amountColor: 'text-rose-600',
  }

  const Icon = typeConfig.icon

  return (
    <div
      className={`
        p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md
        ${item.is_active ? 'border-slate-200/80' : 'border-slate-200/50 opacity-60 bg-slate-50/50'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon & Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${typeConfig.color}`}
          >
            <Icon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
                {item.note || 'Transaksi Rutin'}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeColor}`}
              >
                {typeConfig.label}
              </span>
            </div>

            {/* Schedule & Wallet details */}
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
                <CalendarClock size={13} className="text-[#1A2C4C]" />
                <span>Cair setiap tanggal {item.execution_day}</span>
              </span>

              {item.is_active ? (
                <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-100/60 px-1.5 py-0.5 rounded-md text-[11px]">
                  <Bell size={11} className="text-indigo-600" />
                  <span>Notifikasi Aktif</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-slate-400 bg-slate-100/60 px-1.5 py-0.5 rounded-md text-[11px]">
                  <BellOff size={11} />
                  <span>Notifikasi Nonaktif</span>
                </span>
              )}

              {wallet && (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Wallet size={12} />
                  <span>{wallet.name}</span>
                </span>
              )}

              {category && (
                <span className="text-slate-400">
                  • {category.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Actions */}
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <p className={`text-base sm:text-lg font-extrabold tracking-tight ${typeConfig.amountColor}`}>
            {typeConfig.amountSign}
            {formatCurrency(item.amount)}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mr-1">
              <span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
            <Switch
              checked={item.is_active}
              onCheckedChange={() => onToggle(item.id, item.is_active)}
              aria-label="Toggle status aktif"
            />

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
