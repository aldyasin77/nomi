import React, { useState } from 'react'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
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
import { Input } from '@/components/ui/input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      const msg = 'Kata sandi baru minimal harus memiliki 6 karakter.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Konfirmasi kata sandi tidak cocok. Harap periksa kembali.'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      if (user?.isDemo) {
        toast.success('Kata sandi demo berhasil diubah!')
        handleClose()
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      toast.success('Kata sandi berhasil diubah!')
      handleClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal mengubah kata sandi. Coba lagi nanti.'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Kata Sandi Baru */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Kata Sandi Baru
        </label>
        <div className="relative">
          <Input
            type={showNewPassword ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Minimal 6 karakter"
            className="h-11 pl-4 pr-11 rounded-xl border-slate-200 bg-white text-base text-slate-900 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label={showNewPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Konfirmasi Kata Sandi Baru */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Konfirmasi Kata Sandi Baru
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Ketik ulang kata sandi baru"
            className="h-11 pl-4 pr-11 rounded-xl border-slate-200 bg-white text-base text-slate-900 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1 bg-[#1A2C4C] hover:bg-[#13223b] text-white"
        >
          Simpan Sandi
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1A2C4C]">
                <Lock size={18} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  Ubah Kata Sandi
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Perbarui kata sandi akun Nomi Anda
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-2">{formContent}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="bg-white rounded-t-3xl max-h-[85dvh] flex flex-col border-slate-200 shadow-2xl">
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-3">
          <DrawerHeader className="text-left px-0 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1A2C4C]">
                <Lock size={18} />
              </div>
              <div>
                <DrawerTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  Ubah Kata Sandi
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-500 mt-0.5">
                  Perbarui kata sandi akun Nomi Anda
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="pt-3">{formContent}</div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
