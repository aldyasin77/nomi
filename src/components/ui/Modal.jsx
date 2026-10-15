import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { X } from 'lucide-react'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="rounded-t-2xl md:rounded-t-3xl max-w-lg mx-auto bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-2xl">
        <DrawerHeader className="flex flex-row items-center justify-between px-6 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white text-left">
              {title}
            </DrawerTitle>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 text-left">{subtitle}</p>
            )}
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
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
