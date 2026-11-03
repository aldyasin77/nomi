import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { INITIAL_TRANSACTIONS, INITIAL_WALLETS, INITIAL_CATEGORIES } from '../lib/mockData'

const STORAGE_KEY = 'nomi_demo_transactions'
const WALLETS_KEY = 'nomi_demo_wallets'
const CATEGORIES_KEY = 'nomi_demo_categories'

function getStoredTransactions() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return INITIAL_TRANSACTIONS
}

function getStoredWallets() {
  const saved = localStorage.getItem(WALLETS_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return INITIAL_WALLETS
}

function getStoredCategories() {
  const saved = localStorage.getItem(CATEGORIES_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return INITIAL_CATEGORIES
}

export function useTransactions(filters = {}) {
  const { user } = useAuth()
  const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)
  const [transactions, setTransactions] = useState(() => isDemo ? getStoredTransactions() : [])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)

    if (isDemo) {
      let list = getStoredTransactions()
      const wallets = getStoredWallets()
      const categories = getStoredCategories()

      // Hydrate relational data
      list = list.map(t => ({
        ...t,
        wallet: t.wallet || wallets.find(w => w.id === t.wallet_id) || null,
        to_wallet: t.to_wallet || wallets.find(w => w.id === t.to_wallet_id) || null,
        category: t.category || categories.find(c => c.id === t.category_id) || null,
      }))

      // Apply date range filter
      if (filters.startDate) {
        list = list.filter(t => t.transaction_date >= filters.startDate)
      }
      if (filters.endDate) {
        list = list.filter(t => t.transaction_date <= filters.endDate)
      }

      // Apply type filter
      if (filters.type) {
        list = list.filter(t => t.type === filters.type)
      }

      // Apply wallet filter
      if (filters.walletId) {
        list = list.filter(t => t.wallet_id === filters.walletId || t.to_wallet_id === filters.walletId)
      }
      if (filters.categoryId) {
        list = list.filter(t => t.category_id === filters.categoryId)
      }

      // Sort by transaction_date desc, tie-break by created_at desc
      list.sort((a, b) => {
        const dateDiff = new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0)
        if (dateDiff !== 0) return dateDiff
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })

      // Apply limit
      if (filters.limit) {
        list = list.slice(0, filters.limit)
      }

      setTransactions(list)
      setLoading(false)
      return
    }

    let query = supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets!wallet_id(id, name, type),
        to_wallet:wallets!to_wallet_id(id, name, type),
        category:categories(id, name, type)
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.startDate) query = query.gte('transaction_date', filters.startDate)
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.walletId) query = query.eq('wallet_id', filters.walletId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }, [isDemo, filters.startDate, filters.endDate, filters.type, filters.walletId, filters.categoryId, filters.limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Sinkronisasi otomatis saat proses background lazy evaluation berhasil mencatat transaksi
  useEffect(() => {
    const handleSync = () => {
      fetchTransactions()
    }
    window.addEventListener('nomi_data_changed', handleSync)
    return () => window.removeEventListener('nomi_data_changed', handleSync)
  }, [fetchTransactions])

  const addTransaction = async (transaction) => {
    if (isDemo) {
      const allTxns = getStoredTransactions()
      const wallets = getStoredWallets()
      const categories = getStoredCategories()

      const amount = parseFloat(transaction.amount) || 0
      const newTxn = {
        ...transaction,
        id: `t-${Date.now()}`,
        amount,
        wallet: wallets.find(w => w.id === transaction.wallet_id) || null,
        to_wallet: wallets.find(w => w.id === transaction.to_wallet_id) || null,
        category: categories.find(c => c.id === transaction.category_id) || null,
      }

      const updatedTxns = [newTxn, ...allTxns]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTxns))

      // Update wallet balances according to transaction math
      const updatedWallets = wallets.map(w => {
        let bal = parseFloat(w.balance) || 0
        if (transaction.type === 'income' && w.id === transaction.wallet_id) {
          bal += amount
        } else if (transaction.type === 'expense' && w.id === transaction.wallet_id) {
          bal -= amount
        } else if (transaction.type === 'transfer') {
          if (w.id === transaction.wallet_id) bal -= amount
          if (w.id === transaction.to_wallet_id) bal += amount
        }
        return { ...w, balance: bal }
      })
      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets))

      await fetchTransactions()
      return newTxn
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transaction,
        user_id: user?.id,
      }])
      .select()
      .single()
    
    if (error) throw error
    await fetchTransactions()
    return data
  }

  const updateTransaction = async (id, updates, oldTransaction = null) => {
    if (isDemo) {
      const allTxns = getStoredTransactions()
      const targetTx = oldTransaction || allTxns.find(t => t.id === id)
      const wallets = getStoredWallets()
      const categories = getStoredCategories()

      const newAmount = parseFloat(updates.amount !== undefined ? updates.amount : targetTx?.amount) || 0
      const newType = updates.type || targetTx?.type || 'expense'
      const newWalletId = updates.wallet_id !== undefined ? updates.wallet_id : targetTx?.wallet_id
      const newToWalletId = updates.to_wallet_id !== undefined ? updates.to_wallet_id : targetTx?.to_wallet_id

      // 1. Rekonsiliasi Saldo Dompet (Revert OLD, Apply NEW)
      let updatedWallets = [...wallets]
      if (targetTx) {
        const oldAmount = parseFloat(targetTx.amount) || 0
        const oldType = targetTx.type
        const oldWalletId = targetTx.wallet_id
        const oldToWalletId = targetTx.to_wallet_id

        // Revert efek lama (OLD)
        updatedWallets = updatedWallets.map(w => {
          let bal = parseFloat(w.balance) || 0
          if (oldType === 'income' && w.id === oldWalletId) {
            bal -= oldAmount
          } else if (oldType === 'expense' && w.id === oldWalletId) {
            bal += oldAmount
          } else if (oldType === 'transfer') {
            if (w.id === oldWalletId) bal += oldAmount
            if (w.id === oldToWalletId) bal -= oldAmount
          }
          return { ...w, balance: bal }
        })

        // Terapkan efek baru (NEW)
        updatedWallets = updatedWallets.map(w => {
          let bal = parseFloat(w.balance) || 0
          if (newType === 'income' && w.id === newWalletId) {
            bal += newAmount
          } else if (newType === 'expense' && w.id === newWalletId) {
            bal -= newAmount
          } else if (newType === 'transfer') {
            if (w.id === newWalletId) bal -= newAmount
            if (w.id === newToWalletId) bal += newAmount
          }
          return { ...w, balance: bal }
        })
      }

      localStorage.setItem(WALLETS_KEY, JSON.stringify(updatedWallets))

      // 2. Perbarui transaksi di list
      const updatedTxns = allTxns.map(t => {
        if (t.id === id) {
          const nextCategory = updates.category_id !== undefined
            ? (categories.find(c => c.id === updates.category_id) || null)
            : t.category
          return {
            ...t,
            ...updates,
            amount: newAmount,
            type: newType,
            wallet_id: newWalletId,
            to_wallet_id: newType === 'transfer' ? newToWalletId : null,
            wallet: updatedWallets.find(w => w.id === newWalletId) || null,
            to_wallet: newType === 'transfer' ? (updatedWallets.find(w => w.id === newToWalletId) || null) : null,
            category: newType === 'transfer' ? null : nextCategory,
          }
        }
        return t
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTxns))
      window.dispatchEvent(new Event('nomi_data_changed'))
      await fetchTransactions()
      return updatedTxns.find(t => t.id === id)
    }

    // SUPABASE MODE:
    // Update ke tabel transactions. Trigger PostgreSQL (trigger_update_wallet_balance)
    // akan secara otomatis dan atomik merevert saldo dompet lama dan menerapkan saldo dompet baru.
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        wallet:wallets!wallet_id(id, name, type),
        to_wallet:wallets!to_wallet_id(id, name, type),
        category:categories(id, name, type)
      `)
      .single()
    
    if (error) throw error
    window.dispatchEvent(new Event('nomi_data_changed'))
    await fetchTransactions()
    return data
  }

  const deleteTransaction = async (id) => {
    if (isDemo) {
      const allTxns = getStoredTransactions()
      const updated = allTxns.filter(t => t.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      await fetchTransactions()
      return
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    await fetchTransactions()
  }

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}

/**
 * Get the start and end dates for a given month offset.
 * offset = 0 → current month, offset = -1 → last month, etc.
 */
export function getMonthRange(offset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}
