import { supabase, isSupabaseConfigured } from './supabase'
import { getJakartaDate } from './dateUtils'
import toast from 'react-hot-toast'

// Module-level lock to prevent concurrent executions in the same browser session
let isProcessing = false

/**
 * Normalisasi tipe transaksi untuk tabel transactions (lowercase: 'income', 'expense', 'transfer')
 */
const normalizeTransactionType = (type) => {
  const lower = String(type || '').toLowerCase().trim()
  if (lower === 'income' || lower === 'pemasukan') return 'income'
  if (lower === 'transfer') return 'transfer'
  return 'expense'
}

/**
 * Pengecekan & Eksekusi Otomatis Transaksi Rutin yang Jatuh Tempo (Lazy Evaluation)
 *
 * Kondisi eksekusi:
 * 1. Status transaksi rutin aktif (is_active = true)
 * 2. Tanggal hari ini >= execution_day (atau akhir bulan jika bulan pendek)
 * 3. last_processed_month belum sama dengan bulan-tahun saat ini (misal: '2026-11')
 *
 * @param {object} user - Objek user aktif dari AuthContext
 * @returns {Promise<{success: boolean, count: number, reason?: string}>}
 */
export async function processDueRecurringTransactions(user) {
  if (isProcessing) {
    return { success: false, reason: 'already_processing' }
  }

  if (!user || !user.id) {
    return { success: false, reason: 'unauthenticated' }
  }

  isProcessing = true

  try {
    const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)

    // Waktu lokal Indonesia (WIB = UTC+7)
    const now = getJakartaDate(new Date())
    const currentDay = now.getDate()
    const currentYear = now.getFullYear()
    const currentMonthNum = now.getMonth() + 1
    const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}` // e.g. '2026-11'
    const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate()

    // =========================================================================
    // 1. DEMO MODE (Local Storage Simulation)
    // =========================================================================
    if (isDemo) {
      const RECURRING_KEY = 'nomi_demo_recurring'
      const TX_KEY = 'nomi_demo_transactions'
      const WALLETS_KEY = 'nomi_demo_wallets'
      const CATS_KEY = 'nomi_demo_categories'

      const recurringList = JSON.parse(localStorage.getItem(RECURRING_KEY) || '[]')
      const allTxns = JSON.parse(localStorage.getItem(TX_KEY) || '[]')
      const wallets = JSON.parse(localStorage.getItem(WALLETS_KEY) || '[]')
      const categories = JSON.parse(localStorage.getItem(CATS_KEY) || '[]')

      const dueItems = recurringList.filter((item) => {
        if (!item.is_active) return false
        const execDay = parseInt(item.execution_day, 10) || 1
        const targetDay = Math.min(execDay, daysInMonth)
        const isDatePassed = currentDay >= targetDay
        const notProcessedThisMonth = item.last_processed_month !== currentMonthStr
        return isDatePassed && notProcessedThisMonth
      })

      if (dueItems.length === 0) {
        return { success: true, count: 0 }
      }

      const newTxns = []
      let updatedWallets = [...wallets]

      dueItems.forEach((item) => {
        const execDay = parseInt(item.execution_day, 10) || 1
        const targetDay = Math.min(execDay, daysInMonth)
        const txDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
        const amount = parseFloat(item.amount) || 0
        const cleanType = normalizeTransactionType(item.type)

        const newTx = {
          id: `t-auto-${Date.now()}-${item.id}`,
          user_id: user.id,
          amount,
          type: cleanType,
          transaction_date: txDate,
          wallet_id: item.wallet_id || '',
          to_wallet_id: cleanType === 'transfer' ? (item.to_wallet_id || '') : null,
          category_id: cleanType === 'transfer' ? null : (item.category_id || ''),
          note: item.note || 'Transaksi Rutin',
          created_at: new Date().toISOString(),
          wallet: wallets.find((w) => w.id === item.wallet_id) || null,
          to_wallet: wallets.find((w) => w.id === item.to_wallet_id) || null,
          category: categories.find((c) => c.id === item.category_id) || null,
        }
        newTxns.push(newTx)

        // Update saldo dompet demo
        updatedWallets = updatedWallets.map((w) => {
          let bal = parseFloat(w.balance) || 0
          if (cleanType === 'income' && w.id === item.wallet_id) {
            bal += amount
          } else if (cleanType === 'expense' && w.id === item.wallet_id) {
            bal -= amount
          } else if (cleanType === 'transfer') {
            if (w.id === item.wallet_id) bal -= amount
            if (w.id === item.to_wallet_id) bal += amount
          }
          return { ...w, balance: bal }
        })
      })

      // Update recurring_transactions.last_processed_month di state demo
      const updatedRecurring = recurringList.map((item) => {
        const isProcessed = dueItems.some((d) => d.id === item.id)
        if (isProcessed) {
          return {
            ...item,
            last_processed_month: currentMonthStr,
            updated_at: new Date().toISOString(),
          }
        }
        return item
      })

      localStorage.setItem(TX_KEY, JSON.stringify([...newTxns, ...allTxns]))
      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets))
      localStorage.setItem(RECURRING_KEY, JSON.stringify(updatedRecurring))

      window.dispatchEvent(
        new CustomEvent('nomi_data_changed', {
          detail: { source: 'recurring_automation', count: dueItems.length },
        })
      )

      toast.success(`${dueItems.length} transaksi rutin berhasil dicatat otomatis!`)
      return { success: true, count: dueItems.length, method: 'demo' }
    }

    // =========================================================================
    // 2. SUPABASE MODE
    // =========================================================================

    // A. Coba panggil Database Function (RPC) terlebih dahulu jika sudah dibuat di Supabase
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('process_due_recurring_transactions')
      if (!rpcError && rpcData?.success) {
        const count = Number(rpcData.processed_count) || 0
        if (count > 0) {
          window.dispatchEvent(
            new CustomEvent('nomi_data_changed', {
              detail: { source: 'recurring_automation', count },
            })
          )
          toast.success(`${count} transaksi rutin berhasil dicatat otomatis!`)
        }
        return { success: true, count, method: 'rpc' }
      }
    } catch {
      // Jika RPC belum ada di database, lanjut otomatis ke fallback Frontend Lazy Evaluation
    }

    // B. Frontend Lazy Evaluation (Direct REST Query, Batch Insert & Update)
    const { data: recurringList, error: fetchErr } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)

    if (fetchErr) {
      console.error('Error fetching recurring transactions for lazy evaluation:', fetchErr)
      return { success: false, reason: fetchErr.message }
    }

    if (!recurringList || recurringList.length === 0) {
      return { success: true, count: 0 }
    }

    // Filter item yang jatuh tempo dan belum diproses di bulan ini
    const dueItems = recurringList.filter((item) => {
      if (!item.is_active) return false
      const execDay = parseInt(item.execution_day, 10) || 1
      const targetDay = Math.min(execDay, daysInMonth)
      const isDatePassed = currentDay >= targetDay

      // Cek apakah kolom last_processed_month cocok atau fallback localStorage
      const localProcessed = localStorage.getItem(`nomi_rec_proc_${item.id}`)
      const isProcessed =
        item.last_processed_month === currentMonthStr || localProcessed === currentMonthStr

      return isDatePassed && !isProcessed
    })

    if (dueItems.length === 0) {
      return { success: true, count: 0 }
    }

    // Siapkan array payload untuk INSERT ke tabel transactions
    const transactionsToInsert = dueItems.map((item) => {
      const execDay = parseInt(item.execution_day, 10) || 1
      const targetDay = Math.min(execDay, daysInMonth)
      const txDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
      const cleanType = normalizeTransactionType(item.type)

      return {
        user_id: user.id,
        wallet_id: item.wallet_id || null,
        to_wallet_id: cleanType === 'transfer' ? (item.to_wallet_id || null) : null,
        category_id: cleanType === 'transfer' ? null : (item.category_id || null),
        amount: parseFloat(item.amount) || 0,
        type: cleanType,
        note: item.note || 'Transaksi Rutin',
        transaction_date: txDate,
      }
    })

    // Eksekusi INSERT ke tabel transactions
    const { error: insertErr } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)

    if (insertErr) {
      console.error('Gagal melakukan INSERT transaksi rutin:', insertErr)
      return { success: false, reason: insertErr.message }
    }

    // Sangat Penting: Langsung eksekusi UPDATE kolom last_processed_month pada recurring_transactions
    const dueIds = dueItems.map((d) => d.id)

    // Simpan juga ke localStorage sebagai safety net instan
    dueIds.forEach((id) => {
      try {
        localStorage.setItem(`nomi_rec_proc_${id}`, currentMonthStr)
      } catch {}
    })

    try {
      const { error: updateErr } = await supabase
        .from('recurring_transactions')
        .update({
          last_processed_month: currentMonthStr,
          updated_at: new Date().toISOString(),
        })
        .in('id', dueIds)

      if (updateErr) {
        console.warn(
          'Perhatian: Kolom last_processed_month mungkin belum ada di Supabase. Harap jalankan script migration SQL.',
          updateErr
        )
      }
    } catch (err) {
      console.warn('Gagal update last_processed_month pada Supabase:', err)
    }

    // Beritahukan seluruh hook dan komponen UI untuk sinkronisasi data terbaru
    window.dispatchEvent(
      new CustomEvent('nomi_data_changed', {
        detail: { source: 'recurring_automation', count: dueItems.length },
      })
    )

    toast.success(`${dueItems.length} transaksi rutin berhasil dicatat otomatis!`)
    return { success: true, count: dueItems.length, method: 'frontend_batch' }
  } catch (error) {
    console.error('Unhandled error in processDueRecurringTransactions:', error)
    return { success: false, reason: error.message }
  } finally {
    isProcessing = false
  }
}

