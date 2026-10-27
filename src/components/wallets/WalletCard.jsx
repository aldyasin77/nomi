import { useNavigate } from 'react-router-dom'
import { TrendingUp, Pencil, Trash2, GripVertical } from 'lucide-react'
import { WALLET_THEMES, detectTheme } from '@/data/walletThemes'
import { calculateTotalInterest } from '@/lib/analyticsUtils'
import WalletLogo from './WalletLogo'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const typeLabels = {
  cash: 'Tunai',
  tunai: 'Tunai',
  bank: 'Tabungan',
  savings: 'Tabungan',
  tabungan: 'Tabungan',
  'e-wallet': 'E-Wallet',
  ewallet: 'E-Wallet',
  investment: 'Investasi',
  investasi: 'Investasi',
}

/**
 * Compute projected interest for a savings wallet this month.
 * daily_interest = balance * (APR / 365)
 * projected = daily_interest * days_elapsed_this_month
 */
function getInterestProjection(balance, apr) {
  if (!apr || apr <= 0) return 0
  const now = new Date()
  const dayOfMonth = now.getDate()
  const dailyRate = apr / 100 / 365
  return balance * dailyRate * dayOfMonth
}

/**
 * WalletCard — renders a single wallet with theme-based gradient and bank logo.
 *
 * @param {object}   wallet    Wallet data object
 * @param {string}   theme     Override theme key (optional)
 * @param {boolean}  compact   Compact mode for carousel cards (fixed height h-[190px], no edit/delete)
 * @param {function} onEdit    Called when edit button is clicked
 * @param {function} onDelete  Called when delete button is clicked
 */
export default function WalletCard({
  wallet,
  theme,
  compact = false,
  onEdit,
  onDelete,
  dragHandleProps = null,
  transactions = [],
  totalInterest: propTotalInterest,
  className = '',
}) {
  const navigate = useNavigate()
  const typeLabel = typeLabels[wallet.type?.toLowerCase()] || wallet.type
  const balance = parseFloat(wallet.balance) || 0
  const apr = parseFloat(wallet.annual_interest_rate) || 0
  const isSavings = wallet.type?.toLowerCase() === 'savings'
  const interestProjection = isSavings ? getInterestProjection(balance, apr) : 0

  const totalInterest =
    propTotalInterest !== undefined
      ? propTotalInterest
      : calculateTotalInterest(wallet.id, transactions)

  // Resolve theme: explicit prop > wallet.card_theme > auto-detect
  const themeKey = theme || wallet.card_theme || detectTheme(wallet.name)
  const themeData = WALLET_THEMES[themeKey] || WALLET_THEMES.aurora
  const isDarkText = themeData.textClass === 'text-slate-900'

  const handleCardClick = () => {
    if (wallet?.id) {
      navigate(`/wallet/${wallet.id}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-3xl ${compact ? 'p-5 h-[190px]' : 'p-6 min-h-[190px] cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5'} relative overflow-hidden group animate-fade-in flex flex-col justify-between select-none ${className}`}
      style={{ background: themeData.gradient }}
    >
      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, ${isDarkText ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content — uniform flex column distributed evenly */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <WalletLogo className="w-10 h-10" logoId={wallet.bank_logo} name={wallet.name} />
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isDarkText ? 'text-slate-900' : 'text-white/90'}`}>{wallet.name}</p>
              <p className={`text-xs ${isDarkText ? 'text-slate-600' : 'text-white/50'}`}>{typeLabel}</p>
            </div>
          </div>

          {/* Actions — hidden in compact mode, visible on both mobile & desktop */}
          {!compact && (onEdit || onDelete || dragHandleProps) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(wallet)
                  }}
                  className={`p-2 rounded-lg ${isDarkText ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'} transition-colors cursor-pointer`}
                  aria-label="Edit wallet"
                >
                  <Pencil size={14} className={isDarkText ? 'text-slate-800' : 'text-white'} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(wallet)
                  }}
                  className={`p-2 rounded-lg ${isDarkText ? 'bg-black/10 hover:bg-rose-500/50' : 'bg-white/10 hover:bg-rose-500/50'} transition-colors cursor-pointer`}
                  aria-label="Delete wallet"
                >
                  <Trash2 size={14} className={isDarkText ? 'text-slate-800' : 'text-white'} />
                </button>
              )}
              {dragHandleProps && (
                <button
                  type="button"
                  {...dragHandleProps}
                  onClick={(e) => e.stopPropagation()}
                  className={`p-2 rounded-lg cursor-grab active:cursor-grabbing touch-none ${isDarkText ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'} transition-colors`}
                  aria-label="Geser urutan dompet"
                  title="Geser untuk ubah urutan"
                >
                  <GripVertical size={14} className={isDarkText ? 'text-slate-800' : 'text-white'} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom / Balance & Interest */}
        <div className="mt-auto pt-2">
          <div>
            <p className={`text-[11px] ${isDarkText ? 'text-slate-600' : 'text-white/50'} font-medium mb-0.5`}>Balance</p>
            <p className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight ${isDarkText ? 'text-slate-900' : 'text-white'} truncate`}>
              {formatCurrency(balance)}
            </p>
          </div>

          {/* Interest info for Wallets with APR */}
          {apr > 0 && (
            <div className={`mt-2 pt-2 border-t ${isDarkText ? 'border-black/10' : 'border-white/10'} space-y-1`}>
              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1.5 ${isDarkText ? 'text-slate-800' : 'text-white/90'}`}>
                  <TrendingUp size={13} />
                  <span className="font-medium text-[11px]">Bunga {apr}%/thn</span>
                </div>
                {wallet.interest_payout_date && (
                  <span className={`${isDarkText ? 'text-slate-700 bg-black/10' : 'text-white/80 bg-white/15'} px-2 py-0.5 rounded-full font-semibold text-[10px]`}>
                    Cair tgl {wallet.interest_payout_date}
                  </span>
                )}
              </div>
              <div className={`text-xs font-medium flex items-center justify-between pt-0.5 ${isDarkText ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-100/90'}`}>
                <span>Total Bunga:</span>
                <span className="font-semibold">+{formatCurrency(totalInterest)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
