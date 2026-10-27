import React, { useState, useMemo } from 'react'
import {
  Plus,
  CalendarClock,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
} from 'lucide-react'
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import RecurringCard from '@/components/recurring/RecurringCard'
import RecurringModal from '@/components/recurring/RecurringModal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function RecurringPage() {
  const {
    recurringList,
    loading,
    addRecurring,
    updateRecurring,
    toggleStatus,
    deleteRecurring,
  } = useRecurringTransactions()

  const { wallets } = useWallets()
  const { categories } = useCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'expense', 'income', 'transfer'

  // Summary statistics
  const stats = useMemo(() => {
    let monthlyExpense = 0
    let monthlyIncome = 0
    let activeCount = 0

    recurringList.forEach((item) => {
      if (item.is_active) {
        activeCount += 1
        const type = (item.type || '').toLowerCase()
        if (type === 'expense' || type === 'pengeluaran') {
          monthlyExpense += Number(item.amount) || 0
        } else if (type === 'income' || type === 'pemasukan') {
          monthlyIncome += Number(item.amount) || 0
        }
      }
    })

    return { monthlyExpense, monthlyIncome, activeCount }
  }, [recurringList])

  // Filtered list
  const filteredList = useMemo(() => {
    if (filterType === 'all') return recurringList
    return recurringList.filter((item) => {
      const type = (item.type || '').toLowerCase()
      const normalized = type === 'pengeluaran' ? 'expense' : type === 'pemasukan' ? 'income' : type
      return normalized === filterType
    })
  }, [recurringList, filterType])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleModalSubmit = async (data) => {
    let mappedType = data.type // 'type' dari state UI (misal: 'Pengeluaran')

    if (data.type.toLowerCase() === 'pengeluaran' || data.type.toLowerCase() === 'expense') {
      mappedType = 'Expense'
    } else if (data.type.toLowerCase() === 'pemasukan' || data.type.toLowerCase() === 'income') {
      mappedType = 'Income'
    } else if (data.type.toLowerCase() === 'transfer') {
      mappedType = 'Transfer'
    }

    const sanitizeUuid = (val) => {
      if (!val || typeof val !== 'string' || val.trim() === '') return null
      return val.trim()
    }

    const payload = {
      ...data,
      type: mappedType,
      wallet_id: sanitizeUuid(data.wallet_id),
      category_id: mappedType === 'Transfer' ? null : sanitizeUuid(data.category_id),
      to_wallet_id: mappedType === 'Transfer' ? sanitizeUuid(data.to_wallet_id) : null,
    }

    try {
      if (editingItem) {
        if (!editingItem.id || typeof editingItem.id !== 'string' || editingItem.id.trim() === '') {
          toast.error('ID transaksi tidak valid untuk diperbarui')
          return
        }
        await updateRecurring(editingItem.id.trim(), payload)
        if (payload.is_active) {
          toast.success(
            `Notifikasi aktif: Pengingat "${payload.note}" setiap tgl ${payload.execution_day} telah diperbarui!`,
            { icon: '🔔' }
          )
        } else {
          toast.success('Transaksi rutin diperbarui (status nonaktif).')
        }
      } else {
        await addRecurring(payload)
        if (payload.is_active) {
          toast.success(
            `Transaksi rutin dibuat & notifikasi aktif untuk "${payload.note}" setiap tgl ${payload.execution_day}!`,
            { icon: '🔔' }
          )
        } else {
          toast.success('Transaksi rutin berhasil ditambahkan!')
        }
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan transaksi rutin')
      throw err
    }
  }

  const handleToggle = async (id, currentStatus) => {
    const item = recurringList.find((r) => r.id === id)
    const nextStatus = !currentStatus
    try {
      await toggleStatus(id, currentStatus)
      if (nextStatus) {
        toast.success(
          `Notifikasi Aktif: Pengingat "${item?.note || 'Transaksi'}" akan muncul setiap tanggal ${item?.execution_day}!`,
          { icon: '🔔' }
        )
      } else {
        toast(
          `Notifikasi Dimatikan: Pengingat "${item?.note || 'Transaksi'}" dinonaktifkan.`,
          { icon: '🔕' }
        )
      }
    } catch (err) {
      toast.error('Gagal mengubah status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi rutin ini?')) return
    try {
      await deleteRecurring(id)
      toast.success('Transaksi rutin dihapus')
    } catch (err) {
      toast.error('Gagal menghapus transaksi')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1A2C4C] shadow-xs">
              <CalendarClock size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Langganan & Rutin
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kelola tagihan berulang, langganan bulanan, dan jadwal otomatis
              </p>
            </div>
          </div>
        </div>

        <Button
          icon={Plus}
          onClick={handleOpenAdd}
          className="bg-[#1A2C4C] hover:bg-[#13223b] text-white shadow-md shadow-indigo-950/15"
        >
          Tambah Rutin
        </Button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pengeluaran Rutin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pengeluaran Rutin / Bln</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownCircle size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {formatCurrency(stats.monthlyExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total beban bulanan terencana
          </p>
        </div>

        {/* Total Pemasukan Rutin */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pemasukan Rutin / Bln</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpCircle size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {formatCurrency(stats.monthlyIncome)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Gaji & pemasukan tetap tiap bulan
          </p>
        </div>

        {/* Total Langganan Aktif */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Langganan Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#1A2C4C] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {stats.activeCount} <span className="text-sm font-medium text-slate-400">Jadwal</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Otomatis terhitung dalam arus kas
          </p>
        </div>
      </div>

      {/* 3. Filter Segment */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'expense', label: 'Pengeluaran' },
            { id: 'income', label: 'Pemasukan' },
            { id: 'transfer', label: 'Transfer' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                ${
                  filterType === tab.id
                    ? 'bg-white text-slate-900 shadow-xs scale-100'
                    : 'text-slate-500 hover:text-slate-800'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-slate-400 shrink-0">
          {filteredList.length} Transaksi
        </span>
      </div>

      {/* 4. List View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Belum ada transaksi rutin"
          description="Tambahkan tagihan bulanan, langganan aplikasi, atau gaji untuk pencatatan otomatis."
          actionText="Tambah Transaksi Rutin"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              wallets={wallets}
              categories={categories}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* 5. Responsive Modal (Drawer on Mobile, Dialog on Desktop) */}
      <RecurringModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingItem}
        wallets={wallets}
        categories={categories}
      />
    </div>
  )
}
