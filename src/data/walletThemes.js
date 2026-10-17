/**
 * Wallet Card Theme System
 * Maps card_theme keys to gradient + accent styles.
 * Used by WalletCard and WalletFormModal.
 */

export const WALLET_THEMES = {
  // ── E-Wallet Themes ──────────────────────────────
  gopay: {
    label: 'GoPay',
    gradient: 'linear-gradient(135deg, #00AA5B 0%, #005F3B 100%)',
    accent: '#00AA5B',
    textClass: 'text-white',
    dotColor: '#6ee7b7',
  },
  ovo: {
    label: 'OVO',
    gradient: 'linear-gradient(135deg, #6C3EC1 0%, #3D1C7C 100%)',
    accent: '#6C3EC1',
    textClass: 'text-white',
    dotColor: '#c4b5fd',
  },
  dana: {
    label: 'DANA',
    gradient: 'linear-gradient(135deg, #118EEA 0%, #0A5A9C 100%)',
    accent: '#118EEA',
    textClass: 'text-white',
    dotColor: '#93c5fd',
  },
  shopeepay: {
    label: 'ShopeePay',
    gradient: 'linear-gradient(135deg, #EE4D2D 0%, #9E2A15 100%)',
    accent: '#EE4D2D',
    textClass: 'text-white',
    dotColor: '#fca5a5',
  },

  // ── Bank Themes ──────────────────────────────────
  bca: {
    label: 'Bank BCA',
    gradient: 'linear-gradient(135deg, #003399 0%, #001A4D 100%)',
    accent: '#003399',
    textClass: 'text-white',
    dotColor: '#93c5fd',
  },
  bni: {
    label: 'Bank BNI',
    gradient: 'linear-gradient(135deg, #E85D04 0%, #9C3D02 100%)',
    accent: '#E85D04',
    textClass: 'text-white',
    dotColor: '#fdba74',
  },
  bri: {
    label: 'Bank BRI',
    gradient: 'linear-gradient(135deg, #003B7A 0%, #001D3D 100%)',
    accent: '#003B7A',
    textClass: 'text-white',
    dotColor: '#93c5fd',
  },
  mandiri: {
    label: 'Bank Mandiri',
    gradient: 'linear-gradient(135deg, #003366 0%, #001A33 100%)',
    accent: '#003366',
    textClass: 'text-white',
    dotColor: '#7dd3fc',
  },
  jago: {
    label: 'Bank Jago',
    gradient: 'linear-gradient(135deg, #FFB800 0%, #FF8C00 100%)',
    accent: '#FFB800',
    textClass: 'text-slate-900',
    dotColor: '#fde68a',
  },
  jenius: {
    label: 'Jenius / BTPN',
    gradient: 'linear-gradient(135deg, #00BCD4 0%, #00838F 100%)',
    accent: '#00BCD4',
    textClass: 'text-white',
    dotColor: '#67e8f9',
  },
  seabank: {
    label: 'SeaBank',
    gradient: 'linear-gradient(135deg, #009688 0%, #004D40 100%)',
    accent: '#009688',
    textClass: 'text-white',
    dotColor: '#5eead4',
  },

  // ── Generic Themes ───────────────────────────────
  cash_dark: {
    label: 'Cash (Gelap)',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    accent: '#1E293B',
    textClass: 'text-white',
    dotColor: '#94a3b8',
  },
  cash_green: {
    label: 'Cash (Hijau)',
    gradient: 'linear-gradient(135deg, #065F46 0%, #022C22 100%)',
    accent: '#065F46',
    textClass: 'text-white',
    dotColor: '#6ee7b7',
  },
  aurora: {
    label: 'Aurora (Default)',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #312E81 50%, #06B6D4 100%)',
    accent: '#312E81',
    textClass: 'text-white',
    dotColor: '#a5b4fc',
  },
  rose_gold: {
    label: 'Rose Gold',
    gradient: 'linear-gradient(135deg, #BE185D 0%, #4A0D2B 100%)',
    accent: '#BE185D',
    textClass: 'text-white',
    dotColor: '#fda4af',
  },
  midnight: {
    label: 'Midnight Blue',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #0A1628 100%)',
    accent: '#1E3A5F',
    textClass: 'text-white',
    dotColor: '#7dd3fc',
  },
}

/**
 * Auto-detect best theme based on wallet name.
 * Falls back to 'aurora'.
 */
export function detectTheme(walletName = '') {
  const lower = walletName.toLowerCase()
  if (lower.includes('gopay') || lower.includes('go-pay')) return 'gopay'
  if (lower.includes('ovo')) return 'ovo'
  if (lower.includes('dana')) return 'dana'
  if (lower.includes('shopee')) return 'shopeepay'
  if (lower.includes('bca')) return 'bca'
  if (lower.includes('bni')) return 'bni'
  if (lower.includes('bri') && !lower.includes('hybrid')) return 'bri'
  if (lower.includes('mandiri')) return 'mandiri'
  if (lower.includes('jago')) return 'jago'
  if (lower.includes('jenius') || lower.includes('btpn')) return 'jenius'
  if (lower.includes('sea') && lower.includes('bank')) return 'seabank'
  if (lower.includes('cash') || lower.includes('tunai')) return 'cash_dark'
  return 'aurora'
}

export const THEME_OPTIONS = Object.entries(WALLET_THEMES).map(([key, val]) => ({
  value: key,
  label: val.label,
  gradient: val.gradient,
}))
