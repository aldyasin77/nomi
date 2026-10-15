import { Wallet, Landmark, Smartphone, PiggyBank, TrendingUp, Pencil, Trash2 } from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const typeIcons = {
  cash: Wallet,
  bank: Landmark,
  'e-wallet': Smartphone,
  ewallet: Smartphone,
  savings: PiggyBank,
}

const typeLabels = {
  cash: 'Cash',
  bank: 'Bank Account',
  'e-wallet': 'E-Wallet',
  ewallet: 'E-Wallet',
  savings: 'Savings',
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

export default function WalletCard({ wallet, onEdit, onDelete }) {
  const Icon = typeIcons[wallet.type?.toLowerCase()] || Wallet
  const typeLabel = typeLabels[wallet.type?.toLowerCase()] || wallet.type
  const balance = parseFloat(wallet.balance) || 0
  const apr = parseFloat(wallet.annual_interest_rate) || 0
  const isSavings = wallet.type?.toLowerCase() === 'savings'
  const interestProjection = isSavings ? getInterestProjection(balance, apr) : 0

  return (
    <div className="aurora-gradient rounded-3xl p-6 text-white relative overflow-hidden group animate-fade-in">
      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">{wallet.name}</p>
              <p className="text-xs text-white/50">{typeLabel}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(wallet)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(wallet)}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div>
          <p className="text-xs text-white/50 font-medium mb-1">Balance</p>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(balance)}</p>
        </div>

        {/* Interest info for Wallets with APR */}
        {apr > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-cyan-200">
              <TrendingUp size={14} />
              <span className="font-medium">Bunga {apr}%/thn</span>
            </div>
            {wallet.interest_payout_date && (
              <span className="text-white/80 bg-white/15 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">
                Cair tgl {wallet.interest_payout_date}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
