import { NavLink } from 'react-router-dom'
import { Home, CreditCard, ArrowLeftRight, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/wallets', icon: CreditCard, label: 'Cards' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Spending' },
  { to: '/settings', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const userInitial = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <nav className="bg-white/10 dark:bg-black/10 backdrop-blur-2xl border-t border-white/30 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] rounded-3xl p-2 flex justify-around items-center">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300
              ${
                isActive
                  ? 'text-[#1A2C4C] dark:text-white font-bold bg-white/60 dark:bg-white/20 shadow-xs scale-105'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium'
              }
            `}
          >
            {label === 'Profile' ? (
              <div className="w-5 h-5 rounded-full bg-[#1A2C4C] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                {userInitial}
              </div>
            ) : (
              <Icon size={20} strokeWidth={2.2} />
            )}
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
