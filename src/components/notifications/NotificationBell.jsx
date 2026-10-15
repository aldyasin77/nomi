import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Check,
  ChevronRight,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, urgentCount, markAsRead, markAllAsRead } =
    useNotifications()

  const handleItemClick = (notif) => {
    markAsRead(notif.id)
    setOpen(false)
    navigate('/recurring')
  }

  const renderTypeIcon = (type) => {
    if (type === 'income') {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <TrendingUp size={15} />
        </div>
      )
    }
    if (type === 'transfer') {
      return (
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
          <ArrowLeftRight size={15} />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
        <TrendingDown size={15} />
      </div>
    )
  }

  const contentList = (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            Notifikasi Transaksi Rutin
          </h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
              {unreadCount} baru
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[11px] font-semibold text-[#1A2C4C] hover:underline cursor-pointer flex items-center gap-1"
          >
            <Check size={12} />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      {/* Notification items */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <CalendarClock size={22} />
          </div>
          <p className="text-sm font-bold text-slate-800">Belum ada transaksi rutin aktif</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Aktifkan transaksi rutin atau tambahkan langganan baru untuk menerima notifikasi otomatis.
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/recurring')
            }}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A2C4C] text-white text-xs font-semibold cursor-pointer shadow-xs hover:bg-[#13223b] transition-colors"
          >
            <Sparkles size={13} />
            <span>Atur Transaksi Rutin</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`
                group p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3
                ${
                  notif.isRead
                    ? 'bg-white border-slate-100 hover:border-slate-200'
                    : 'bg-indigo-50/40 border-indigo-100/90 shadow-2xs hover:bg-indigo-50/70'
                }
              `}
            >
              {renderTypeIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {notif.note}
                  </p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${notif.badgeColor}`}
                  >
                    {notif.statusBadge}
                  </span>
                </div>

                <p className="text-[11px] font-extrabold text-slate-700 mt-0.5">
                  {formatCurrency(notif.amount)}
                </p>

                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  {notif.urgency === 'today' ? (
                    <AlertCircle size={12} className="text-rose-500 shrink-0" />
                  ) : (
                    <Clock size={12} className="text-slate-400 shrink-0" />
                  )}
                  <span className={notif.urgency === 'today' ? 'font-semibold text-rose-600' : ''}>
                    {notif.statusLabel}
                  </span>
                </p>
              </div>

              <ChevronRight
                size={14}
                className="text-slate-300 group-hover:text-slate-600 shrink-0 self-center transition-colors"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/recurring')
            }}
            className="w-full text-center py-2.5 text-xs font-bold text-[#1A2C4C] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-dashed border-slate-200 mt-2"
          >
            Buka Halaman Langganan & Rutin →
          </button>
        </div>
      )}
    </div>
  )

  const triggerButton = (
    <button
      type="button"
      className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer relative"
      aria-label="Notifikasi Transaksi Rutin"
    >
      <Bell size={18} />
      {notifications.length > 0 && (
        <span
          className={`
            absolute top-2 right-2 flex items-center justify-center rounded-full ring-2 ring-white text-[9px] font-black text-white
            ${urgentCount > 0 ? 'w-4 h-4 bg-rose-500 animate-pulse' : 'w-3.5 h-3.5 bg-indigo-600'}
          `}
        >
          {notifications.length > 9 ? '9+' : notifications.length}
        </span>
      )}
    </button>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-88 p-4 rounded-3xl bg-white shadow-2xl border border-slate-200 z-[9999]"
        >
          {contentList}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{triggerButton}</div>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-white rounded-t-3xl max-h-[85dvh] flex flex-col border-slate-200 shadow-2xl">
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
            <DrawerHeader className="text-left px-0 pb-2">
              <DrawerTitle className="text-lg font-bold text-slate-900">
                Pusat Notifikasi
              </DrawerTitle>
              <DrawerDescription className="text-xs text-slate-500">
                Pengingat tagihan dan transaksi otomatis bulanan
              </DrawerDescription>
            </DrawerHeader>
            <div className="pt-2">{contentList}</div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
