import React from 'react'
import { Rocket, Sparkles } from 'lucide-react'
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
} from '@/components/ui/drawer'
import Button from '@/components/ui/Button'
import { changelog } from '@/data/changelog'

export default function ChangelogModal({ isOpen, onClose }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const contentList = (
    <div className="space-y-6">
      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {changelog.map((log, index) => (
          <div key={log.version} className="relative group">
            {/* Timeline Dot Indicator */}
            <div
              className={`
                absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110
                ${
                  index === 0
                    ? 'bg-[#1A2C4C] border-white ring-4 ring-indigo-50 shadow-xs'
                    : 'bg-white border-slate-300 ring-4 ring-slate-50'
                }
              `}
            >
              {index === 0 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            {/* Version & Date Header */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                {log.version}
              </span>
              {log.isLatest && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Versi Terbaru</span>
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium">
                • {log.date}
              </span>
            </div>

            {/* Feature Bullets Card */}
            <div
              className={`
                p-4 rounded-2xl border transition-all
                ${
                  index === 0
                    ? 'bg-slate-50/70 border-slate-200/90 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }
              `}
            >
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {log.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <span
                      className={`
                        w-1.5 h-1.5 rounded-full mt-1.5 shrink-0
                        ${index === 0 ? 'bg-[#1A2C4C]' : 'bg-slate-400'}
                      `}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={onClose}
          className="w-full bg-[#1A2C4C] hover:bg-[#13223b] text-white"
        >
          Tutup Catatan Pembaruan
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                <Rocket size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  Apa yang Baru?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Catatan rilis dan riwayat pembaruan fitur Nomi
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-3 max-h-[60vh] overflow-y-auto pr-1">{contentList}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-3xl max-h-[85dvh] flex flex-col border-slate-200 shadow-2xl">
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
          <DrawerHeader className="text-left px-0 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                <Rocket size={20} />
              </div>
              <div>
                <DrawerTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  Apa yang Baru?
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-500 mt-0.5">
                  Catatan rilis dan riwayat pembaruan fitur Nomi
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="pt-4">{contentList}</div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
