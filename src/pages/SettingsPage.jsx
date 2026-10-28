import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, ArrowLeft } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import CategoryFormModal from '../components/categories/CategoryFormModal'
import Profile from '../components/profile/Profile'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { extractCategoryEmojiAndName } from '@/lib/categoryUtils'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SettingsPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [mobileCategoryView, setMobileCategoryView] = useState(false)

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleAdd = async (data) => {
    try {
      await addCategory(data)
      toast.success('Kategori berhasil dibuat!')
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kategori')
      throw err
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleUpdate = async (data) => {
    try {
      await updateCategory(editingCategory.id, data)
      toast.success('Kategori diperbarui!')
      setEditingCategory(null)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui kategori')
      throw err
    }
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Hapus kategori "${category.name}"? Transaksi yang sudah menggunakan kategori ini tidak akan terhapus.`)) return
    try {
      await deleteCategory(category.id)
      toast.success('Kategori dihapus')
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kategori')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
  }

  const renderCategoryList = (list, title) => {
    const totalLimit = list.reduce((sum, cat) => sum + (parseFloat(cat.monthly_limit) || 0), 0)

    return (
      <GlassCard className="p-5 sm:p-6 animate-fade-in bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {totalLimit > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                {formatCurrency(totalLimit)}/bln
              </span>
            )}
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {list.length} item
            </span>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Belum ada kategori</p>
        ) : (
          <div className="space-y-1">
            {list.map(category => {
              const { emoji, name: cleanName } = extractCategoryEmojiAndName(category.name, category.type)
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between py-3 px-3 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs border border-white/60 dark:border-slate-800 ${category.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40'
                      }`}>
                      <span>{emoji}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{cleanName}</p>
                      {category.monthly_limit > 0 && (
                        <p className="text-xs text-slate-400 font-medium">
                          Limit: {formatCurrency(category.monthly_limit)}/bln
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Edit category"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-slate-400 hover:text-rose-500 cursor-pointer"
                      aria-label="Delete category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* MOBILE VIEW (Shows iOS/Android Profile or Category View)  */}
      {/* ======================================================== */}
      <div className="md:hidden">
        {mobileCategoryView ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setMobileCategoryView(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer p-1"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Profil</span>
              </button>
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setShowModal(true)}
                className="bg-[#1A2C4C] text-white"
              >
                Kategori
              </Button>
            </div>

            <div className="space-y-4">
              {renderCategoryList(expenseCategories, 'Kategori Pengeluaran')}
              {renderCategoryList(incomeCategories, 'Kategori Pemasukan')}
            </div>
          </div>
        ) : (
          <Profile onOpenCategoryConfig={() => setMobileCategoryView(true)} />
        )}
      </div>

      {/* ======================================================== */}
      {/* DESKTOP VIEW (Side-by-side Profile and Categories)       */}
      {/* ======================================================== */}
      <div className="hidden md:block space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan & Kategori</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola profil dan konfigurasi kategori keuanganmu</p>
          </div>
          <Button icon={Plus} onClick={() => setShowModal(true)} className="bg-[#1A2C4C] text-white">
            Tambah Kategori
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card on Desktop */}
          <div className="lg:col-span-1">
            <Profile onOpenCategoryConfig={() => setShowModal(true)} />
          </div>

          {/* Categories Grid on Desktop */}
          <div className="lg:col-span-2 space-y-6">
            {categories.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="Belum ada kategori"
                description="Buat kategori untuk merapikan pencatatan transaksi kamu"
              />
            ) : (
              <div className="space-y-6">
                {renderCategoryList(expenseCategories, 'Kategori Pengeluaran (Expense)')}
                {renderCategoryList(incomeCategories, 'Kategori Pemasukan (Income)')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Category Bottom Sheet Modal */}
      {showModal && (
        <CategoryFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={editingCategory ? handleUpdate : handleAdd}
          editingCategory={editingCategory}
        />
      )}
    </div>
  )
}
