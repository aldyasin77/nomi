import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Memanggil Database Function (RPC) process_due_transactions di Supabase.
 * Logika pengecekan tanggal, filter bulan, dan insert/update dilakukan secara atomik
 * di dalam satu transaksi database PostgreSQL (bebas race condition & duplikasi).
 *
 * @param {string} userId - UUID user yang sedang login
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function processDueTransactions(userId) {
  if (!userId || !isSupabaseConfigured) {
    return { success: false }
  }

  const { data, error } = await supabase.rpc('process_due_transactions', {
    current_user_id: userId,
  })

  if (error) {
    console.error('Gagal memproses transaksi rutin:', error)
    return { success: false, error }
  }

  if (data?.processed_count > 0) {
    window.dispatchEvent(
      new CustomEvent('nomi_data_changed', {
        detail: { source: 'recurring_rpc', count: data.processed_count },
      })
    )
  }

  return { success: true, data }
}
