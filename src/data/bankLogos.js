/**
 * Bank, E-Wallet, Investasi, & Finansial Logos Configuration
 * Data terverifikasi dengan ketersediaan SVG lokal di /logos/ dan idn-finlogos
 */

export const WALLET_GROUPS = [
  {
    category: 'BANK',
    title: 'Bank',
    items: [
      { id: 'bca', name: 'BCA', logoId: 'bca', file: 'bca.svg', defaultType: 'savings' },
      { id: 'mandiri', name: 'Mandiri', logoId: 'mandiri', file: 'mandiri.svg', defaultType: 'savings' },
      { id: 'bni', name: 'BNI', logoId: 'bni', file: 'bni.svg', defaultType: 'savings' },
      { id: 'bri', name: 'BRI', logoId: 'bri', file: 'bri.svg', defaultType: 'savings' },
      { id: 'bsi', name: 'BSI', logoId: 'bsi', file: 'bsi.svg', defaultType: 'savings' },
      { id: 'cimb', name: 'CIMB Niaga', logoId: 'cimb', file: 'cimb.svg', defaultType: 'savings' },
      { id: 'permata', name: 'Permata', logoId: 'permata', file: 'permata.svg', defaultType: 'savings' },
      { id: 'danamon', name: 'Danamon', logoId: 'danamon', file: 'danamon.svg', defaultType: 'savings' },
      { id: 'btn', name: 'BTN', logoId: 'btn', file: 'btn.svg', defaultType: 'savings' },
      { id: 'bjb', name: 'BJB', logoId: 'bjb', file: 'bjb.svg', defaultType: 'savings' },
      { id: 'seabank', name: 'SeaBank', logoId: 'seabank', file: 'seabank.svg', defaultType: 'savings' },
      { id: 'jago', name: 'Bank Jago', logoId: 'jago', file: 'jago.svg', defaultType: 'savings' },
      { id: 'blu', name: 'Blu BCA', logoId: 'blu', file: 'blu.svg', defaultType: 'savings' },
      { id: 'allo', name: 'Allo Bank', logoId: 'allo', file: 'allo.svg', defaultType: 'savings' },
      { id: 'ocbc', name: 'OCBC NISP', logoId: 'ocbc', file: 'ocbc.svg', defaultType: 'savings' },
      { id: 'mega', name: 'Bank Mega', logoId: 'mega', file: 'mega.svg', defaultType: 'savings' },
      { id: 'sinarmas', name: 'Sinarmas', logoId: 'sinarmas', file: 'sinarmas.svg', defaultType: 'savings' },
      { id: 'jenius', name: 'Jenius', logoId: 'jenius', file: 'jenius.svg', defaultType: 'savings' },
      { id: 'neobank', name: 'Neobank', logoId: 'neobank', file: 'neobank.svg', defaultType: 'savings' },
    ],
  },
  {
    category: 'E-WALLET',
    title: 'E-Wallet',
    items: [
      { id: 'gopay', name: 'GoPay', logoId: 'gopay', file: 'gopay.svg', defaultType: 'e-wallet' },
      { id: 'ovo', name: 'OVO', logoId: 'ovo', file: 'ovo.svg', defaultType: 'e-wallet' },
      { id: 'dana', name: 'DANA', logoId: 'dana', file: 'dana.svg', defaultType: 'e-wallet' },
      { id: 'shopeepay', name: 'ShopeePay', logoId: 'shopeepay', file: 'shopeepay.svg', defaultType: 'e-wallet' },
      { id: 'linkaja', name: 'LinkAja', logoId: 'linkaja', file: 'linkaja.svg', defaultType: 'e-wallet' },
      { id: 'flip', name: 'Flip', logoId: 'flip', file: 'flip.svg', defaultType: 'e-wallet' },
      { id: 'doku', name: 'DOKU', logoId: 'doku', file: 'doku.svg', defaultType: 'e-wallet' },
    ],
  },
  {
    category: 'INVESTASI',
    title: 'Investasi',
    items: [
      { id: 'bibit', name: 'Bibit', logoId: 'bibit', defaultType: 'investment' },
      { id: 'stockbit', name: 'Stockbit', logoId: 'stockbit', defaultType: 'investment' },
      { id: 'ajaib', name: 'Ajaib', logoId: 'ajaib', defaultType: 'investment' },
      { id: 'pluang', name: 'Pluang', logoId: 'pluang', defaultType: 'investment' },
    ],
  },
  {
    category: 'LAINNYA',
    title: 'Lainnya',
    items: [
      { id: 'tunai', name: 'Tunai', logoId: 'tunai', defaultType: 'cash' },
    ],
  },
]

// Flat list for searching or quick lookup
export const ALL_WALLET_ITEMS = WALLET_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.category }))
)

export const BANK_LOGOS = [
  { value: 'none', label: 'Tanpa Logo (Default)', file: null },
  { value: 'bca.svg', label: 'BCA (Bank Central Asia)', file: 'bca.svg' },
  { value: 'mandiri.svg', label: 'Bank Mandiri', file: 'mandiri.svg' },
  { value: 'bni.svg', label: 'Bank BNI', file: 'bni.svg' },
  { value: 'bri.svg', label: 'Bank BRI', file: 'bri.svg' },
  { value: 'bsi.svg', label: 'Bank BSI', file: 'bsi.svg' },
  { value: 'cimb.svg', label: 'CIMB Niaga', file: 'cimb.svg' },
  { value: 'permata.svg', label: 'Bank Permata', file: 'permata.svg' },
  { value: 'danamon.svg', label: 'Bank Danamon', file: 'danamon.svg' },
  { value: 'btn.svg', label: 'Bank BTN', file: 'btn.svg' },
  { value: 'bjb.svg', label: 'Bank BJB', file: 'bjb.svg' },
  { value: 'seabank.svg', label: 'SeaBank', file: 'seabank.svg' },
  { value: 'jago.svg', label: 'Bank Jago', file: 'jago.svg' },
  { value: 'blu.svg', label: 'Blu by BCA Digital', file: 'blu.svg' },
  { value: 'allo.svg', label: 'Allo Bank', file: 'allo.svg' },
  { value: 'ocbc.svg', label: 'OCBC NISP', file: 'ocbc.svg' },
  { value: 'mega.svg', label: 'Bank Mega', file: 'mega.svg' },
  { value: 'sinarmas.svg', label: 'Sinarmas', file: 'sinarmas.svg' },
  { value: 'jenius.svg', label: 'Jenius', file: 'jenius.svg' },
  { value: 'neobank.svg', label: 'Neobank', file: 'neobank.svg' },
  { value: 'gopay.svg', label: 'GoPay', file: 'gopay.svg' },
  { value: 'ovo.svg', label: 'OVO', file: 'ovo.svg' },
  { value: 'dana.svg', label: 'DANA', file: 'dana.svg' },
  { value: 'shopeepay.svg', label: 'ShopeePay', file: 'shopeepay.svg' },
  { value: 'linkaja.svg', label: 'LinkAja', file: 'linkaja.svg' },
  { value: 'flip.svg', label: 'Flip', file: 'flip.svg' },
  { value: 'doku.svg', label: 'DOKU', file: 'doku.svg' },
]

/**
 * Resolves any logo value or legacy string to a valid filename or remote URL
 */
export function resolveBankLogo(logo) {
  if (!logo || logo === 'none') return null
  if (typeof logo !== 'string') return null

  // If already a full URL
  if (logo.startsWith('http://') || logo.startsWith('https://')) return logo

  // Strip file extension to get the raw identifier (e.g. 'Gopay.png' -> 'gopay', 'bca.svg' -> 'bca')
  const clean = logo.replace(/\.(png|svg|webp|jpeg|jpg)$/i, '')
  const normalized = clean.toLowerCase().replace(/[^a-z0-9]/g, '')

  const map = {
    allo: 'allo.svg',
    bca: 'bca.svg',
    bjb: 'bjb.svg',
    blu: 'blu.svg',
    blubca: 'blu.svg',
    bni: 'bni.svg',
    bri: 'bri.svg',
    bsi: 'bsi.svg',
    btn: 'btn.svg',
    cimb: 'cimb.svg',
    cimbniaga: 'cimb.svg',
    dana: 'dana.svg',
    danamon: 'danamon.svg',
    doku: 'doku.svg',
    flip: 'flip.svg',
    gopay: 'gopay.svg',
    jago: 'jago.svg',
    jenius: 'jenius.svg',
    linkaja: 'linkaja.svg',
    mandiri: 'mandiri.svg',
    mega: 'mega.svg',
    neobank: 'neobank.svg',
    ocbc: 'ocbc.svg',
    ovo: 'ovo.svg',
    permata: 'permata.svg',
    seabank: 'seabank.svg',
    shopeepay: 'shopeepay.svg',
    sinarmas: 'sinarmas.svg',
    spay: 'shopeepay.svg',
  }

  return map[normalized] || (normalized ? `${normalized}.svg` : null)
}

/**
 * Auto-detect matching logo file based on wallet name
 */
export function detectBankLogo(name = '') {
  if (!name || typeof name !== 'string') return ''
  const lower = name.toLowerCase()
  if (lower.includes('blu')) return 'blu.svg'
  if (lower.includes('bca')) return 'bca.svg'
  if (lower.includes('mandiri')) return 'mandiri.svg'
  if (lower.includes('jago')) return 'jago.svg'
  if (lower.includes('gopay')) return 'gopay.svg'
  if (lower.includes('ovo')) return 'ovo.svg'
  if (lower.includes('dana')) return 'dana.svg'
  if (lower.includes('shopee') || lower.includes('spay')) return 'shopeepay.svg'
  if (lower.includes('bri')) return 'bri.svg'
  if (lower.includes('bni')) return 'bni.svg'
  if (lower.includes('bsi')) return 'bsi.svg'
  if (lower.includes('bjb')) return 'bjb.svg'
  if (lower.includes('btn')) return 'btn.svg'
  if (lower.includes('allo')) return 'allo.svg'
  if (lower.includes('cimb')) return 'cimb.svg'
  if (lower.includes('permata')) return 'permata.svg'
  if (lower.includes('danamon')) return 'danamon.svg'
  if (lower.includes('seabank')) return 'seabank.svg'
  if (lower.includes('linkaja')) return 'linkaja.svg'
  if (lower.includes('flip')) return 'flip.svg'
  if (lower.includes('doku')) return 'doku.svg'
  if (lower.includes('ocbc')) return 'ocbc.svg'
  if (lower.includes('mega')) return 'mega.svg'
  if (lower.includes('sinarmas')) return 'sinarmas.svg'
  if (lower.includes('jenius')) return 'jenius.svg'
  if (lower.includes('neobank')) return 'neobank.svg'
  return ''
}
