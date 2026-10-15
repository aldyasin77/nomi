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

      // Sort by transaction_date desc
      list.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))

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

    if (filters.startDate) query = query.gte('transaction_date', filters.startDate)
    if (filters.endDate) query = query.lte('transaction_date', filters.endDate)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.walletId) query = query.eq('wallet_id', filters.walletId)
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }, [isDemo, filters.startDate, filters.endDate, filters.type, filters.walletId, filters.limit])

  useEffect(() => {
    fetchTransactions()
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

  const updateTransaction = async (id, updates) => {
    if (isDemo) {
      const allTxns = getStoredTransactions()
      const updated = allTxns.map(t => t.id === id ? { ...t, ...updates } : t)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      await fetchTransactions()
      return updated.find(t => t.id === id)
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
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
