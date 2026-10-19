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
  DrawerClose,
} from '@/components/ui/drawer'
import { X } from 'lucide-react'
import TransactionForm from './TransactionForm'

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  wallets = [],
  categories = [],
  initialTab = 'expense',
  initialType,
  initialWalletId,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const modalTitle =
    initialTab === 'transfer' || initialType === 'transfer'
      ? 'Transfer Dana'
      : initialTab === 'income' || initialType === 'income'
      ? 'Tambah Pemasukan'
      : 'Tambah Transaksi'

  const modalSubtitle = 'Catat aktivitas keuanganmu dengan mudah'

  // DESKTOP / TABLET (Centered Dialog)
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              {modalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {modalSubtitle}
            </DialogDescription>
          </DialogHeader>

          <TransactionForm
            onSubmit={onSubmit}
            onClose={onClose}
            wallets={wallets}
            categories={categories}
            initialTab={initialTab}
            initialType={initialType}
            initialWalletId={initialWalletId}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // MOBILE (Bottom Sheet Drawer with safe keyboard dvh)
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85dvh] rounded-t-3xl border-t border-slate-100 bg-white dark:bg-slate-900 shadow-2xl">
        <DrawerHeader className="px-6 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="text-left">
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {modalTitle}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-slate-500">
              {modalSubtitle}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-6 py-4">
          <TransactionForm
            onSubmit={onSubmit}
            onClose={onClose}
            wallets={wallets}
            categories={categories}
            initialTab={initialTab}
            initialType={initialType}
            initialWalletId={initialWalletId}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
