import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CalendarClock,
  Settings,
  LogOut,
} from 'lucide-react'
import logoSvg from '@/assets/logo.svg'

import { useNotifications } from '@/hooks/useNotifications'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/recurring', icon: CalendarClock, label: 'Langganan / Rutin' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { signOut, user } = useAuth()
  const { notifications } = useNotifications()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full z-40 w-64 glass rounded-r-3xl flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 bg-white shadow-xs border border-slate-100">
            <img src={logoSvg} alt="Nomi Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg tracking-tight">Nomi</h1>
            <p className="text-[11px] text-slate-400 font-medium">Finance Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl
              text-sm font-semibold transition-all duration-200
              ${
                isActive
                  ? 'bg-[#1A2C4C] text-white shadow-md shadow-indigo-950/10'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {to === '/recurring' && notifications.length > 0 && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {notifications.length}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="px-3 pb-6 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/40 rounded-2xl border border-white/40">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            <span>{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            {user?.isDemo && (
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded-full">
                Demo Mode
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 w-full cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
