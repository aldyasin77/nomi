export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export const INDONESIAN_SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

export const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Konversi tanggal ke objek Date yang dinormalisasi ke zona waktu Asia/Jakarta (WIB)
 */
export const getJakartaDate = (date) => {
  if (!date) return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  let d = date
  // Jika formatnya 'YYYY-MM-DD', parsing langsung ke UTC midnight bisa menggeser tanggal
  // Tambahkan T12:00:00+07:00 untuk mengunci tanggal kalender di zona WIB
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    d = `${d}T12:00:00+07:00`
  }
  const dateObj = d instanceof Date ? d : new Date(d)
  if (isNaN(dateObj.getTime())) return new Date()
  return new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
}

/**
 * Mengambil string tanggal YYYY-MM-DD dalam zona waktu Asia/Jakarta
 */
export const getJakartaDateKey = (date) => {
  if (!date) return 'Unknown'
  const d = getJakartaDate(date)
  if (isNaN(d.getTime())) return 'Unknown'
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format string tanggal transaksi menjadi teks header kelompok yang ramah pengguna
 * Contoh: 'Hari ini', 'Kemarin', 'Senin, 27 Okt'
 */
export function formatDateHeader(dateStr) {
  if (!dateStr) return ''
  if (dateStr === 'Hari ini' || dateStr === 'Kemarin') return dateStr

  const txDate = getJakartaDate(dateStr)
  const today = getJakartaDate(new Date())

  // Normalisasikan ke jam 00:00:00 untuk membandingkan selisih hari kalender di WIB
  const dTx = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const diffTime = dToday.getTime() - dTx.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'

  const dayName = DAYS_ID[txDate.getDay()]
  const dayNum = txDate.getDate()
  const monthName = INDONESIAN_SHORT_MONTHS[txDate.getMonth()]
  const year = txDate.getFullYear()

  if (year === today.getFullYear()) {
    return `${dayName}, ${dayNum} ${monthName}`
  }
  return `${dayName}, ${dayNum} ${monthName} ${year}`
}

/**
 * Mengelompokkan daftar transaksi berdasarkan tanggal (descending)
 * Menggunakan zona waktu Asia/Jakarta untuk normalisasi tanggal
 */
export function groupTransactionsByDate(transactions = []) {
  const groups = {}
  const sorted = [...transactions].sort((a, b) => {
    const rawA = a.transaction_date || a.date || a.created_at
    const rawB = b.transaction_date || b.date || b.created_at
    const dateA = rawA ? new Date(rawA).getTime() : 0
    const dateB = rawB ? new Date(rawB).getTime() : 0
    return dateB - dateA
  })

  sorted.forEach((t) => {
    const rawDate = t.transaction_date || t.date || t.created_at
    const dateKey = rawDate ? getJakartaDateKey(rawDate) : 'Unknown'
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
  })

  return groups
}

// Alias helper groupByDate
export const groupByDate = groupTransactionsByDate

