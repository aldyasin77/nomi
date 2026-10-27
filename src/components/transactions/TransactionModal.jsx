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
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
          <DialogHeader className="mb-2 shrink-0">
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

  // MOBILE (Bottom Sheet Drawer with dynamic height up to 90vh)
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[90vh] h-auto flex flex-col overflow-hidden rounded-t-3xl border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        contentWrapperClassName="flex-1 flex flex-col overflow-hidden p-0 pb-0"
      >
        {/* Mobile Header: Left Close Button, Center Title */}
        <DrawerHeader className="px-4 py-2.5 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          </DrawerClose>
          <DrawerTitle className="text-base font-bold text-slate-900 dark:text-white text-center">
            Catat transaksi
          </DrawerTitle>
          <div className="w-8 h-8" /> {/* spacer for perfect center */}
        </DrawerHeader>

        <div className="relative flex-1 flex flex-col overflow-hidden">
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
