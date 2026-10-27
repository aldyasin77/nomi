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

  return allTransactions
    .filter((tx) => {
      if (tx.wallet_id !== walletId && tx.to_wallet_id !== walletId) return false

      const catName = (
        tx.category?.name ||
        tx.category_name ||
        (typeof tx.category === 'string' ? tx.category : '') ||
        tx.note ||
        ''
      ).toLowerCase()

      return catName.includes('bunga') || catName.includes('interest')
    })
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0)
}
