import { useState, useEffect } from 'react'
import { resolveBankLogo, detectBankLogo } from '@/data/bankLogos'

// Modern, harmonious pastel palettes for initials fallback
const FALLBACK_PALETTES = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200/80',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200/80',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200/80',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200/80',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200/80',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200/80',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200/80',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200/80',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200/80',
  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200/80',
]

function getPalette(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length
  return FALLBACK_PALETTES[index]
}

export default function BankItemIcon({
  item,
  size = 'md', // 'sm' (32px), 'md' (48px), 'lg' (56px)
  className = '',
}) {
  const name = item?.name || (typeof item === 'string' ? item : 'Bank')
  const rawIdentifier = item?.bank_logo || item?.file || item?.logoId || (typeof item === 'string' ? item : null)
  
  // Resolve exact logo file or auto-detect based on name
  const resolvedFileName = resolveBankLogo(rawIdentifier) || resolveBankLogo(detectBankLogo(name))
  const logoId = resolvedFileName ? resolvedFileName.replace(/\.(svg|png)$/i, '') : null

  // Candidate sources in order: local SVG first, then GitHub CDN
  const sources = []
  if (resolvedFileName) {
    if (resolvedFileName.startsWith('http')) {
      sources.push(resolvedFileName)
    } else {
      sources.push(`/logos/${resolvedFileName}`)
      if (logoId) {
        sources.push(`https://raw.githubusercontent.com/hafidznoor/idn-finlogos/master/logos/${logoId}.svg`)
      }
    }
  }

  const [sourceIndex, setSourceIndex] = useState(0)
  const [hasFailedAll, setHasFailedAll] = useState(sources.length === 0)

  useEffect(() => {
    setSourceIndex(0)
    setHasFailedAll(sources.length === 0)
  }, [name, rawIdentifier, resolvedFileName])

  const handleImageError = () => {
    if (sourceIndex + 1 < sources.length) {
      setSourceIndex(sourceIndex + 1)
    } else {
      setHasFailedAll(true)
    }
  }

  const initialChar = name.trim().charAt(0).toUpperCase() || 'B'
  const paletteClass = getPalette(name)

  // Size configurations
  const sizeMap = {
    sm: {
      wrapper: 'w-8 h-8 min-w-[32px] text-xs',
      img: 'p-1',
    },
    md: {
      wrapper: 'w-12 h-12 min-w-[48px] text-base',
      img: 'p-2',
    },
    lg: {
      wrapper: 'w-14 h-14 min-w-[56px] text-lg',
      img: 'p-2.5',
    },
  }
  const currentSize = sizeMap[size] || sizeMap.md

  // If no source or all candidates failed (e.g. Tunai, Stockbit, Bibit), render initials
  if (hasFailedAll || sources.length === 0) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold border select-none shrink-0 transition-transform ${currentSize.wrapper} ${paletteClass} ${className}`}
        aria-label={name}
        title={name}
      >
        <span>{initialChar}</span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden select-none transition-transform ${currentSize.wrapper} ${className}`}
      title={name}
    >
      <img
        key={sources[sourceIndex]}
        src={sources[sourceIndex]}
        alt={name}
        onError={handleImageError}
        className={`w-full h-full object-contain ${currentSize.img}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
