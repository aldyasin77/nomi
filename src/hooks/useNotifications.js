import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRecurringTransactions } from './useRecurringTransactions'

const READ_STORAGE_KEY = 'nomi_read_notifications'
const SYNC_EVENT = 'nomi_read_notifications_sync'

export function useNotifications() {
  const { recurringList } = useRecurringTransactions()
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Synchronize readIds across components and tabs
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail) {
        setReadIds(e.detail)
      } else {
        try {
          const saved = localStorage.getItem(READ_STORAGE_KEY)
          setReadIds(saved ? JSON.parse(saved) : [])
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener(SYNC_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Save readIds to localStorage and notify other instances
  const saveReadIds = useCallback((newReadIds) => {
    setReadIds(newReadIds)
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(newReadIds))
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: newReadIds }))
    } catch (e) {
      console.error('Failed to save read notifications:', e)
    }
  }, [])

  // Generate notifications from active recurring transactions
  const notifications = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDate()
    const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    const activeRecurring = recurringList.filter((item) => item.is_active)

    return activeRecurring.map((item) => {
      const execDay = item.execution_day || 1
      let urgency = 'upcoming' // 'today' | 'soon' | 'upcoming'
      let daysRemaining = 0
      let statusLabel = ''
      let statusBadge = ''
      let badgeColor = ''

      if (execDay === currentDay) {
        urgency = 'today'
        daysRemaining = 0
        statusLabel = 'Jatuh tempo hari ini!'
        statusBadge = 'Hari Ini'
        badgeColor = 'bg-rose-50 text-rose-600 border-rose-200'
      } else if (execDay > currentDay) {
        daysRemaining = execDay - currentDay
        if (daysRemaining <= 3) {
          urgency = 'soon'
          statusLabel = `Jatuh tempo dalam ${daysRemaining} hari`
          statusBadge = `${daysRemaining} hari lagi`
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
        } else {
          urgency = 'upcoming'
          statusLabel = `Akan cair tanggal ${execDay} bulan ini`
          statusBadge = `Tgl ${execDay}`
          badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
        }
      } else {
        // execDay < currentDay: Next month
        daysRemaining = (daysInCurrentMonth - currentDay) + execDay
        if (daysRemaining <= 3) {
          urgency = 'soon'
          statusLabel = `Jatuh tempo dalam ${daysRemaining} hari`
          statusBadge = `${daysRemaining} hari lagi`
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
        } else {
          urgency = 'upcoming'
          statusLabel = `Jadwal cair berikutnya tanggal ${execDay}`
          statusBadge = `Tgl ${execDay}`
          badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
        }
      }

      // Unique notification ID per item and cycle (day/month) to track read status
      const notifId = `notif-${item.id}-${execDay}`
      const isRead = readIds.includes(notifId)

      return {
        id: notifId,
        recurringId: item.id,
        note: item.note || 'Transaksi Rutin',
        amount: item.amount,
        type: item.type || 'expense',
        execution_day: execDay,
        urgency,
        daysRemaining,
        statusLabel,
        statusBadge,
        badgeColor,
        isRead,
        createdAt: item.created_at || new Date().toISOString(),
      }
    }).sort((a, b) => {
      // Prioritize 'today' first, then 'soon', then by daysRemaining
      const priority = { today: 0, soon: 1, upcoming: 2 }
      if (priority[a.urgency] !== priority[b.urgency]) {
        return priority[a.urgency] - priority[b.urgency]
      }
      return a.daysRemaining - b.daysRemaining
    })
  }, [recurringList, readIds])

  // Count of unread active notifications
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // Urgent items count (only unread items due today or within 3 days)
  const urgentCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && (n.urgency === 'today' || n.urgency === 'soon')).length
  }, [notifications])

  const markAsRead = useCallback((notifId) => {
    setReadIds((prev) => {
      if (prev.includes(notifId)) return prev
      const next = [...prev, notifId]
      saveReadIds(next)
      return next
    })
  }, [saveReadIds])

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id)
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds]))
      saveReadIds(next)
      return next
    })
  }, [notifications, saveReadIds])

  return {
    notifications,
    unreadCount,
    urgentCount,
    hasActiveRecurring: notifications.length > 0,
    markAsRead,
    markAllAsRead,
  }
}
