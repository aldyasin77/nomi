import { useState, useEffect } from 'react'
import { Banknote } from 'lucide-react'
import { resolveBankLogo, detectBankLogo } from '@/data/bankLogos'

/**
 * WalletLogo — Universal wallet and bank logo renderer with graceful fallbacks.
 *
 * @param {string} logoId    The bank/wallet logo identifier (e.g., 'bca.svg', 'tunai', or null)
 * @param {string} name      Wallet name (e.g., 'Tunai', 'BCA Utama')
 * @param {string} className Tailwind size classes (default: 'w-10 h-10')
 */
export default function WalletLogo({
  logoId,
  name = '',
  className = 'w-10 h-10',
}) {
  const [hasError, setHasError] = useState(false)

  // Reset error state if logoId or name changes
  useEffect(() => {
    setHasError(false)
  }, [logoId, name])

  // Normalization for cash / tunai check
  const rawId = String(logoId || '').trim().toLowerCase().replace(/\.(svg|png|webp|jpg|jpeg)$/i, '')
  const rawName = String(name || '').trim().toLowerCase()
  const isCash =
    rawId === 'tunai' ||
    rawId === 'cash' ||
    rawId.includes('tunai') ||
    rawId.includes('cash') ||
    rawName === 'tunai' ||
    rawName === 'cash' ||
    rawName.includes('tunai') ||
    rawName.includes('cash')

  // Special handling: if tunai / cash, bypass <img> and render Banknote icon
  if (isCash) {
    return (
      <div
        className={`rounded-xl bg-white shadow-xs border border-white/40 flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        title={name || 'Tunai'}
      >
        <Banknote className="w-1/2 h-1/2 text-emerald-600" />
      </div>
    )
  }

  // Determine effective logo identifier (supports explicit logoId or auto-detected logo from name)
  const targetLogo = (logoId && logoId !== 'none') ? logoId : detectBankLogo(name)

  // Determine initial character for initials fallback
  const initialChar = name ? name.trim().charAt(0).toUpperCase() : '?'

  // UI Fallback: If hasError is true OR logoId is empty/null, DO NOT render <img>.
  // Render a soft gray/light blue rounded-xl box with initial letter in the center.
  if (!targetLogo || targetLogo === 'none' || hasError) {
    return (
      <div
        className={`rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center font-bold text-base shadow-xs select-none shrink-0 ${className}`}
        title={name}
      >
        <span>{initialChar}</span>
      </div>
    )
  }

  // Resolve logo file / URL
  let imageSrc = null
  if (targetLogo.startsWith('http://') || targetLogo.startsWith('https://') || targetLogo.startsWith('/')) {
    imageSrc = targetLogo
  } else {
    const resolvedFile = resolveBankLogo(targetLogo)
    if (resolvedFile) {
      imageSrc = resolvedFile.startsWith('http') ? resolvedFile : `/logos/${resolvedFile}`
    }
  }

  // If resolving returned null (e.g. unknown logo with no file), fallback to initials
  if (!imageSrc) {
    return (
      <div
        className={`rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center font-bold text-base shadow-xs select-none shrink-0 ${className}`}
        title={name}
      >
        <span>{initialChar}</span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl bg-white/95 shadow-xs border border-white/40 flex items-center justify-center shrink-0 overflow-hidden p-1.5 ${className}`}
      title={name}
    >
      <img
        src={imageSrc}
        alt={name || 'Bank Logo'}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  )
}
