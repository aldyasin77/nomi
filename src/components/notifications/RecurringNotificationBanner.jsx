import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, AlertCircle } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function RecurringNotificationBanner() {
  const navigate = useNavigate()
  const { notifications } = useNotifications()

  if (!notifications || notifications.length === 0) return null

  // Find the most urgent notification
  const primaryNotif = notifications[0]
  const isUrgent = primaryNotif.urgency === 'today' || primaryNotif.urgency === 'soon'

  return (
    <div
      onClick={() => navigate('/recurring')}
      className={`
        p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs
        ${
          isUrgent
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/80 hover:border-amber-300'
            : 'bg-gradient-to-r from-[#1A2C4C]/8 via-[#1A2C4C]/4 to-transparent border-slate-200/80 hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`
            w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border
            ${
              isUrgent
                ? 'bg-amber-100/80 text-amber-700 border-amber-200'
                : 'bg-indigo-50 text-[#1A2C4C] border-indigo-100'
            }
          `}
        >
          {isUrgent ? (
            <AlertCircle size={18} className="animate-pulse" />
          ) : (
            <Bell size={18} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${primaryNotif.badgeColor}`}
            >
              {primaryNotif.statusBadge}
            </span>
            <p className="text-xs font-bold text-slate-800 truncate">
              {primaryNotif.note} • {formatCurrency(primaryNotif.amount)}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {primaryNotif.statusLabel} ({notifications.length} transaksi rutin aktif)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs font-bold text-[#1A2C4C] shrink-0">
        <span className="hidden sm:inline">Lihat Jadwal</span>
        <ChevronRight size={15} />
      </div>
    </div>
  )
}
