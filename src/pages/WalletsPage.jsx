import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { useWallets } from '../hooks/useWallets'
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

export default function WalletsPage() {
  const { wallets, totalBalance, addWallet, updateWallet, deleteWallet } = useWallets()
  const [showModal, setShowModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)

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

      {/* Wallet Grid */}
      {wallets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No wallets yet"
          description="Add your first wallet to start tracking your money"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
