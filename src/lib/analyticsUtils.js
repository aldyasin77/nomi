/**
 * Utility functions for financial analytics and balance computations.
 */

/**
 * Menghitung persentase pertumbuhan saldo (Month-over-Month)
 * @param {number} currentTotalBalance - Total saldo semua dompet saat ini
 * @param {Array} currentMonthTransactions - Array semua transaksi bulan ini
 * @returns {number} Persentase pertumbuhan saldo (positif, negatif, atau 0)
 */
export function calculateBalanceGrowth(currentTotalBalance = 0, currentMonthTransactions = []) {
  const current = Number(currentTotalBalance) || 0
  const txList = Array.isArray(currentMonthTransactions) ? currentMonthTransactions : []

  // Hitung total pemasukan bulan ini
  const income = txList
    .filter((tx) => {
      const type = (tx.type || '').toLowerCase()
      return type === 'income' || type === 'pemasukan'
    })
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)

  // Hitung total pengeluaran bulan ini
  const expense = txList
    .filter((tx) => {
      const type = (tx.type || '').toLowerCase()
      return type === 'expense' || type === 'pengeluaran'
    })
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)

  // Hitung Net Change (Selisih Bersih)
  const netChange = income - expense

  // Hitung Saldo Bulan Lalu
  const prevBalance = current - netChange

  // Hitung Persentase Pertumbuhan
  if (prevBalance === 0) {
    return current > 0 ? 100 : 0
  }

  return ((current - prevBalance) / prevBalance) * 100
}

/**
 * Menghitung total akumulasi bunga untuk dompet tertentu dari daftar transaksi
 * @param {string} walletId - ID dompet
 * @param {Array} allTransactions - Array semua transaksi
 * @returns {number} Total akumulasi nominal bunga
 */
export function calculateTotalInterest(walletId, allTransactions = []) {
  if (!walletId || !Array.isArray(allTransactions) || allTransactions.length === 0) {
    return 0
  }

  const netInterest = allTransactions
    .filter((tx) => {
      if (tx.wallet_id !== walletId && tx.to_wallet_id !== walletId) return false

      const catName = (
        tx.category?.name ||
        tx.category_name ||
        (typeof tx.category === 'string' ? tx.category : '') ||
        ''
      ).toLowerCase()
      const note = (tx.note || '').toLowerCase()
      const combinedText = `${catName} ${note}`.trim()

      const type = (tx.type || '').toLowerCase()

      // Pemasukan bunga
      if (type === 'income' || type === 'pemasukan') {
        return combinedText.includes('bunga') || combinedText.includes('interest')
      }

      // Pengeluaran pajak bunga
      if (type === 'expense' || type === 'pengeluaran') {
        const hasBungaOrInterest = combinedText.includes('bunga') || combinedText.includes('interest')
        const hasPajak = combinedText.includes('pajak') || combinedText.includes('tax')
        const hasSimpananOrTabungan = combinedText.includes('simpanan') || combinedText.includes('tabungan')

        return (
          hasBungaOrInterest ||
          (hasPajak && hasSimpananOrTabungan) ||
          combinedText.includes('pajak bunga') ||
          combinedText.includes('tax interest')
        )
      }

      return false
    })
    .reduce((sum, tx) => {
      const type = (tx.type || '').toLowerCase()
      const amt = parseFloat(tx.amount) || 0
      // Income menambah akumulasi bunga, Expense (pajak bunga) mengurangi akumulasi bunga
      if (type === 'expense' || type === 'pengeluaran') {
        return sum - amt
      }
      return sum + amt
    }, 0)

  return Math.max(0, netInterest)
}
