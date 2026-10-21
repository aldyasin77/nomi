export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export const INDONESIAN_SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Format string tanggal transaksi menjadi teks header kelompok yang ramah pengguna
 * Contoh: 'Hari ini', 'Kemarin', 'Senin, 19 Okt'
 */
export function formatDateHeader(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateDateString = date.toISOString().split('T')[0]
  const todayDateString = today.toISOString().split('T')[0]
  const yesterdayDateString = yesterday.toISOString().split('T')[0]

  if (dateDateString === todayDateString) return 'Hari ini'
  if (dateDateString === yesterdayDateString) return 'Kemarin'

  const dayName = DAYS_ID[date.getDay()]
  const dayNum = date.getDate()
  const monthName = INDONESIAN_SHORT_MONTHS[date.getMonth()]
  const year = date.getFullYear()

  if (year === today.getFullYear()) {
    return `${dayName}, ${dayNum} ${monthName}`
  }
  return `${dayName}, ${dayNum} ${monthName} ${year}`
}

/**
 * Mengelompokkan daftar transaksi berdasarkan tanggal (descending)
 */
export function groupTransactionsByDate(transactions = []) {
  const groups = {}
  const sorted = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transaction_date || a.created_at).getTime()
    const dateB = new Date(b.transaction_date || b.created_at).getTime()
    return dateB - dateA
  })

  sorted.forEach((t) => {
    const dateKey = t.transaction_date || 'Unknown'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
  })

  return groups
}
