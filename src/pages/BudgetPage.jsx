import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, TrendingUp, TrendingDown } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions, getMonthRange } from '@/hooks/useTransactions'
import { useBudgets } from '@/hooks/useBudgets'
import BudgetSection from '@/components/dashboard/BudgetSection'
import PageHeader from '@/components/common/PageHeader'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export default function BudgetPage() {
  const navigate = useNavigate()
  const { categories } = useCategories()

  // Ambil transaksi bulan berjalan untuk kalkulasi konsumsi budget
  const currentMonth = useMemo(() => getMonthRange(0), [])
  const { transactions: monthTransactions } = useTransactions({
    startDate: currentMonth.startDate,
    endDate: currentMonth.endDate,
  })

  // Hitung status budget per kategori
  const { budgets, totalBudget, totalSpent, totalRemaining } = useBudgets(categories, monthTransactions)

  // Persentase keseluruhan konsumsi anggaran
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const clampedPercentage = Math.min(overallPercentage, 100)

  // Warna indikator bar: hijau (<75%), kuning (75-99%), merah (>=100%)
  const progressBarColor =
    overallPercentage >= 100
      ? 'bg-rose-500'
      : overallPercentage >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in relative">
      {/* 1. Page Header Reusable */}
      <PageHeader
        title="Budget Progress"
        subtitle="Pantau batas limit & realisasi anggaran"
        showBack={true}
        onBack={() => navigate('/')}
        rightAction={
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Atur Limit Kategori"
            aria-label="Atur Limit Kategori"
          >
            <Settings size={18} />
          </button>
        }
      />

      {/* Konten Halaman */}
      <div className="space-y-6">
        {/* 2. Konsolidasi Summary Card (1 Card Utama Minimalis & Hemat Ruang) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          {/* Bagian Atas: Label & Nominal Utama */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                TOTAL LIMIT BULAN INI
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-1">
                {formatCurrency(totalBudget)}
              </h2>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  overallPercentage >= 100
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    : overallPercentage >= 75
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
              >
                {overallPercentage.toFixed(0)}% terpakai
              </span>
            </div>
          </div>

          {/* Bagian Tengah: Progress Bar Horizontal Tebal */}
          <div className="mt-5 space-y-1.5">
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarColor}`}
                style={{ width: `${clampedPercentage}%` }}
              />
            </div>
          </div>

          {/* Bagian Bawah: Split View (2 Kolom: Terpakai & Sisa Anggaran) */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/80">
            {/* Kolom Kiri: Terpakai */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <TrendingDown size={14} className="text-rose-500" />
                <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                  TERPAKAI
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-rose-500 tracking-tight mt-1">
                {formatCurrency(totalSpent)}
              </p>
            </div>

            {/* Kolom Kanan: Sisa Anggaran */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <TrendingUp size={14} className="text-emerald-500" />
                <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                  SISA ANGGARAN
                </span>
              </div>
              <p
                className={`text-lg sm:text-xl font-bold tracking-tight mt-1 ${
                  totalRemaining >= 0
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              >
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Komponen Progress List Kategori (Interaktif) */}
        <BudgetSection
          budgets={budgets}
          startDate={currentMonth.startDate}
          endDate={currentMonth.endDate}
        />
      </div>
    </div>
  )
}
