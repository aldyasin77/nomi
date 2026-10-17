/**
 * Bank & E-Wallet Logos Configuration
 * All files are located in /public/logos/
 */

export const BANK_LOGOS = [
  { value: 'none', label: 'Tanpa Logo (Default)', file: null },
  { value: 'BCA.png', label: 'BCA (Bank Central Asia)', file: 'BCA.png' },
  { value: 'Mandiri.png', label: 'Bank Mandiri', file: 'Mandiri.png' },
  { value: 'BNI.png', label: 'Bank BNI', file: 'BNI.png' },
  { value: 'BRI.png', label: 'Bank BRI', file: 'BRI.png' },
  { value: 'BTN.png', label: 'Bank BTN', file: 'BTN.png' },
  { value: 'BJB.png', label: 'Bank BJB', file: 'BJB.png' },
  { value: 'Blu BCA.png', label: 'Blu by BCA Digital', file: 'Blu BCA.png' },
  { value: 'Jago.png', label: 'Bank Jago', file: 'Jago.png' },
  { value: 'Allo.png', label: 'Allo Bank', file: 'Allo.png' },
  { value: 'Gopay.png', label: 'GoPay', file: 'Gopay.png' },
  { value: 'Ovo.png', label: 'OVO', file: 'Ovo.png' },
  { value: 'Dana.png', label: 'DANA', file: 'Dana.png' },
  { value: 'Spay.png', label: 'ShopeePay', file: 'Spay.png' },
]

/**
 * Resolves any logo value or legacy string to a valid filename in /public/logos/
 */
export function resolveBankLogo(logo) {
  if (!logo || logo === 'none') return null
  if (typeof logo !== 'string') return null

  if (logo.endsWith('.png')) return logo

  const normalized = logo.toLowerCase().replace(/[^a-z0-9]/g, '')
  const map = {
    allo: 'Allo.png',
    bca: 'BCA.png',
    bjb: 'BJB.png',
    blu: 'Blu BCA.png',
    blubca: 'Blu BCA.png',
    bni: 'BNI.png',
    bri: 'BRI.png',
    btn: 'BTN.png',
    dana: 'Dana.png',
    gopay: 'Gopay.png',
    jago: 'Jago.png',
    mandiri: 'Mandiri.png',
    ovo: 'Ovo.png',
    spay: 'Spay.png',
    shopeepay: 'Spay.png',
  }

  return map[normalized] || `${logo}.png`
}

/**
 * Auto-detect matching logo file based on wallet name
 */
export function detectBankLogo(name = '') {
  if (!name || typeof name !== 'string') return ''
  const lower = name.toLowerCase()
  if (lower.includes('blu')) return 'Blu BCA.png'
  if (lower.includes('bca')) return 'BCA.png'
  if (lower.includes('mandiri')) return 'Mandiri.png'
  if (lower.includes('jago')) return 'Jago.png'
  if (lower.includes('gopay')) return 'Gopay.png'
  if (lower.includes('ovo')) return 'Ovo.png'
  if (lower.includes('dana')) return 'Dana.png'
  if (lower.includes('shopee') || lower.includes('spay')) return 'Spay.png'
  if (lower.includes('bri')) return 'BRI.png'
  if (lower.includes('bni')) return 'BNI.png'
  if (lower.includes('bjb')) return 'BJB.png'
  if (lower.includes('btn')) return 'BTN.png'
  if (lower.includes('allo')) return 'Allo.png'
  return ''
}
