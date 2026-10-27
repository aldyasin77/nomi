import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWallets } from '../hooks/useWallets'
import { useTransactions } from '../hooks/useTransactions'
import WalletCard from '../components/wallets/WalletCard'
import WalletFormModal from '../components/wallets/WalletFormModal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function SortableWalletItem({ wallet, onEdit, onDelete, transactions = [] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <WalletCard
        wallet={wallet}
        onEdit={onEdit}
        onDelete={onDelete}
        transactions={transactions}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default function WalletsPage() {
  const {
    wallets,
    totalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    reorderWallets,
  } = useWallets()
  const { transactions } = useTransactions()
  const [showModal, setShowModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAdd = async (data) => {
    try {
      await addWallet(data)
      toast.success('Wallet created!')
    } catch (err) {
      toast.error(err.message || 'Failed to create wallet')
      throw err
    }
  }

  const handleEdit = (wallet) => {
    setEditingWallet(wallet)
    setShowModal(true)
  }

  const handleUpdate = async (data) => {
    try {
      await updateWallet(editingWallet.id, data)
      toast.success('Wallet updated!')
      setEditingWallet(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update wallet')
      throw err
    }
  }

  const handleDelete = async (wallet) => {
    if (!window.confirm(`Delete "${wallet.name}"? This cannot be undone.`)) return
    try {
      await deleteWallet(wallet.id)
      toast.success('Wallet deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete wallet')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingWallet(null)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = wallets.findIndex((w) => w.id === active.id)
    const newIndex = wallets.findIndex((w) => w.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrdered = arrayMove(wallets, oldIndex, newIndex)
      try {
        await reorderWallets(newOrdered)
        toast.success('Urutan dompet berhasil disimpan!')
      } catch (err) {
        toast.error('Gagal menyimpan urutan dompet')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallets</h1>
          <p className="text-sm text-slate-500 mt-1">
            Total Balance: <span className="font-semibold text-slate-900">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>
          Add Wallet
        </Button>
      </div>

      {/* Wallet Grid with Drag & Drop */}
      {wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No wallets yet"
          description="Add your first wallet to start tracking your money"
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={wallets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <SortableWalletItem
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  transactions={transactions}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <WalletFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={editingWallet ? handleUpdate : handleAdd}
          editingWallet={editingWallet}
        />
      )}
    </div>
  )
}

