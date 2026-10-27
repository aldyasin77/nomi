import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  Tag,
  UserCheck,
  CalendarClock,
  ChevronRight,
  LogOut,
  Camera,
  KeyRound,
  Rocket,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase } from '@/lib/supabase'
import { currentVersion } from '@/data/changelog'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/input'
import Button from '@/components/ui/Button'
import ChangePasswordModal from './ChangePasswordModal'
import ChangelogModal from './ChangelogModal'
import toast from 'react-hot-toast'

export default function Profile({ onOpenCategoryConfig }) {
  const { user, signOut } = useAuth()
  const { notifications } = useNotifications()
  const navigate = useNavigate()

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  )
  const [savingProfile, setSavingProfile] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || 'user@example.com'
  const avatarUrl = user?.user_metadata?.avatar_url

  // Initial calculation
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setSavingProfile(true)
    try {
      if (user?.isDemo) {
        toast.success('Profil demo diperbarui!')
        setEditProfileOpen(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      if (error) throw error

      toast.success('Profil berhasil diperbarui!')
      setEditProfileOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Berhasil keluar')
      navigate('/login')
    } catch (err) {
      toast.error('Gagal keluar')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto pb-6">
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-blue-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          {/* Profile Picture */}
          <div className="relative mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-22 h-22 rounded-full object-cover shadow-lg ring-4 ring-white"
              />
            ) : (
              <div className="w-22 h-22 rounded-full bg-gradient-to-tr from-[#0C397F] via-[#1A6BD8] to-[#38BDF8] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-950/20 ring-4 ring-white">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#1A2C4C] text-white flex items-center justify-center shadow-md ring-2 ring-white cursor-pointer hover:scale-110 transition-transform"
              aria-label="Edit avatar"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Full Name & Email */}
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {displayName}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {email}
          </p>
        </div>
      </div>

      {/* 2. iOS/Android Settings Menu List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
          Pengaturan Akun & Keuangan
        </h3>

        <div className="bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          <ul className="divide-y divide-slate-100 text-sm">
            {/* Menu 1: Konfigurasi Kantong/Wallet */}
            <li>
              <button
                type="button"
                onClick={() => navigate('/wallets')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                    <Wallet size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Konfigurasi Kantong/Wallet
                    </p>
                    <p className="text-xs text-slate-400">
                      Kelola rekening bank, e-wallet, & kantong tabungan
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </li>

            {/* Menu 2: Konfigurasi Kategori */}
            <li>
              <button
                type="button"
                onClick={onOpenCategoryConfig}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                    <Tag size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Konfigurasi Kategori
                    </p>
                    <p className="text-xs text-slate-400">
                      Atur kategori pemasukan & pengeluaran bulanan
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </li>

            {/* Menu 3: Langganan & Transaksi Rutin */}
            <li>
              <button
                type="button"
                onClick={() => navigate('/recurring')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <CalendarClock size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Langganan & Transaksi Rutin
                    </p>
                    <p className="text-xs text-slate-400">
                      Tagihan bulanan, langganan, & jadwal otomatis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {notifications.length}
                    </span>
                  )}
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </button>
            </li>

            {/* Menu 4: Edit Profil */}
            <li>
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <UserCheck size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Edit Profil
                    </p>
                    <p className="text-xs text-slate-400">
                      Ubah nama lengkap dan informasi akun
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </li>

            {/* Menu 5: Apa yang Baru? (Changelog) */}
            <li>
              <button
                type="button"
                onClick={() => setChangelogOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <Rocket size={19} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">
                        Apa yang Baru?
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentVersion}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Catatan pembaruan & riwayat fitur Nomi
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </li>

            {/* Menu 6: Ubah Kata Sandi */}
            <li>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
                    <KeyRound size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Ubah Kata Sandi
                    </p>
                    <p className="text-xs text-slate-400">
                      Ganti kata sandi login akun Anda
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Sign Out Button & Version Label */}
      <div className="pt-2 text-center space-y-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-sm transition-colors cursor-pointer shadow-xs active:scale-98"
        >
          <LogOut size={16} />
          <span>Keluar dari Akun</span>
        </button>

        <p className="text-xs text-muted-foreground tracking-tight select-none">
          Nomi {currentVersion}
        </p>
      </div>

      {/* 4. Edit Profile Bottom Sheet Modal */}
      <Modal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Profil"
        subtitle="Perbarui data nama pengguna kamu"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Lengkap (Full Name)
            </label>
            <Input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap kamu"
              className="h-11 px-4 rounded-xl border-slate-200 bg-white text-base text-slate-900 focus-visible:ring-[#1A2C4C]/20 focus-visible:border-[#1A2C4C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email
            </label>
            <Input
              type="email"
              disabled
              value={email}
              className="h-11 px-4 rounded-xl border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Alamat email terdaftar di Supabase tidak dapat diubah di sini
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditProfileOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              loading={savingProfile}
              className="flex-1 bg-[#1A2C4C] hover:bg-[#13223b] text-white"
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Change Password Responsive Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* 6. Changelog Responsive Modal */}
      <ChangelogModal
        isOpen={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />
    </div>
  )
}
