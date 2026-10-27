import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'nomi_demo_recurring'

const INITIAL_DEMO_RECURRING = [
  {
    id: 'rec-1',
    note: 'Netflix Premium',
    amount: 186000,
    type: 'expense',
    execution_day: 5,
    is_active: true,
    wallet_id: '',
    category_id: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-2',
    note: 'Spotify Family',
    amount: 86900,
    type: 'expense',
    execution_day: 12,
    is_active: true,
    wallet_id: '',
    category_id: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-3',
    note: 'Internet & WiFi Rumah',
    amount: 385000,
    type: 'expense',
    execution_day: 20,
    is_active: true,
    wallet_id: '',
    category_id: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-4',
    note: 'Gaji Bulanan',
    amount: 12500000,
    type: 'income',
    execution_day: 25,
    is_active: true,
    wallet_id: '',
    category_id: '',
    created_at: new Date().toISOString(),
  },
]

function getInitialDemoData() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
  }
  return INITIAL_DEMO_RECURRING
}

export const mapRecurringTypeToDb = (type) => {
  if (!type) return 'Expense'
  const lower = String(type).toLowerCase().trim()
  if (lower === 'pengeluaran' || lower === 'expense') return 'Expense'
  if (lower === 'pemasukan' || lower === 'income') return 'Income'
  if (lower === 'transfer') return 'Transfer'
  return 'Expense'
}

export const mapRecurringTypeToUi = (type) => {
  if (!type) return 'Pengeluaran'
  const lower = String(type).toLowerCase().trim()
  if (lower === 'pengeluaran' || lower === 'expense') return 'Pengeluaran'
  if (lower === 'pemasukan' || lower === 'income') return 'Pemasukan'
  if (lower === 'transfer') return 'Transfer'
  return 'Pengeluaran'
}

export function useRecurringTransactions() {
  const { user } = useAuth()
  const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)
  const [recurringList, setRecurringList] = useState(() => (isDemo ? getInitialDemoData() : []))
  const [loading, setLoading] = useState(true)

  const fetchRecurring = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      setRecurringList(getInitialDemoData())
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('execution_day', { ascending: true })

      if (error) {
        console.error('Error fetching recurring transactions:', error)
        // Fallback to local storage if table is not yet set up
        setRecurringList(getInitialDemoData())
      } else {
        const normalized = (data || []).map((item) => ({
          ...item,
          type: mapRecurringTypeToDb(item.type),
        }))
        setRecurringList(normalized)
      }
    } catch (err) {
      console.error('Failed to query recurring_transactions:', err)
      setRecurringList(getInitialDemoData())
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  const addRecurring = async (item) => {
    let mappedType = item.type
    if (typeof item.type === 'string') {
      const lower = item.type.toLowerCase().trim()
      if (lower === 'pengeluaran' || lower === 'expense') {
        mappedType = 'Expense'
      } else if (lower === 'pemasukan' || lower === 'income') {
        mappedType = 'Income'
      } else if (lower === 'transfer') {
        mappedType = 'Transfer'
      } else {
        mappedType = 'Expense'
      }
    } else {
      mappedType = 'Expense'
    }

    const sanitizeUuid = (val) => {
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) return null
      return val.trim()
    }

    const payload = {
      ...item,
      amount: parseFloat(item.amount) || 0,
      execution_day: parseInt(item.execution_day, 10) || 1,
      is_active: item.is_active ?? true,
      note: item.note || '',
      type: mappedType,
      wallet_id: sanitizeUuid(item.wallet_id),
      to_wallet_id: mappedType === 'Transfer' ? sanitizeUuid(item.to_wallet_id) : null,
      category_id: mappedType === 'Transfer' ? null : sanitizeUuid(item.category_id),
    }
    delete payload.id

    if (isDemo) {
      const newItem = {
        ...payload,
        id: `rec-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      const updated = [...recurringList, newItem]
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newItem
    }

    try {
      const currentUser = user?.id ? user : (await supabase.auth.getUser()).data.user
      const record = { ...payload }
      if (currentUser?.id) {
        record.user_id = currentUser.id
      }

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([record])
        .select()
        .single()

      if (error) throw error

      setRecurringList((prev) => [...prev, data])
      return data
    } catch (err) {
      console.error('Failed to add recurring in Supabase, saving to local state:', err)
      // Local fallback
      const fallbackItem = {
        ...payload,
        id: `rec-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      const updated = [...recurringList, fallbackItem]
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return fallbackItem
    }
  }

  const updateRecurring = async (id, updates) => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('Invalid recurring transaction ID for update:', id)
      throw new Error('ID transaksi tidak valid untuk pembaruan')
    }
    const transactionId = id.trim()

    let mappedType = updates.type
    if (updates.type !== undefined) {
      if (typeof updates.type === 'string') {
        const lower = updates.type.toLowerCase().trim()
        if (lower === 'pengeluaran' || lower === 'expense') {
          mappedType = 'Expense'
        } else if (lower === 'pemasukan' || lower === 'income') {
          mappedType = 'Income'
        } else if (lower === 'transfer') {
          mappedType = 'Transfer'
        } else {
          mappedType = 'Expense'
        }
      } else {
        mappedType = 'Expense'
      }
    }

    // Sanitasi UUID columns: ubah string kosong "" menjadi null
    const sanitizeUuid = (val) => {
      if (val === undefined) return undefined
      if (val === null || (typeof val === 'string' && val.trim() === '')) return null
      return val.trim()
    }

    const cleanUpdates = {
      ...updates,
      ...(updates.amount !== undefined ? { amount: parseFloat(updates.amount) || 0 } : {}),
      ...(updates.execution_day !== undefined ? { execution_day: parseInt(updates.execution_day, 10) || 1 } : {}),
      ...(updates.type !== undefined ? { type: mappedType } : {}),
      ...(updates.wallet_id !== undefined ? { wallet_id: sanitizeUuid(updates.wallet_id) } : {}),
      ...(updates.category_id !== undefined ? { category_id: mappedType === 'Transfer' ? null : sanitizeUuid(updates.category_id) } : {}),
      ...(updates.to_wallet_id !== undefined ? { to_wallet_id: mappedType === 'Transfer' ? sanitizeUuid(updates.to_wallet_id) : null } : {}),
      updated_at: new Date().toISOString(),
    }

    // Pastikan ID transaksi tidak ada di dalam payload update
    delete cleanUpdates.id
    delete cleanUpdates.user_id

    if (isDemo) {
      const updated = recurringList.map((item) => (item.id === transactionId ? { ...item, ...cleanUpdates } : item))
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update(cleanUpdates)
        .eq('id', transactionId)

      if (error) throw error

      setRecurringList((prev) =>
        prev.map((item) => (item.id === transactionId ? { ...item, ...cleanUpdates } : item))
      )
    } catch (err) {
      console.error('Failed to update in Supabase, updating local state:', err)
      const updated = recurringList.map((item) => (item.id === transactionId ? { ...item, ...cleanUpdates } : item))
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      throw err
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    return updateRecurring(id, { is_active: !currentStatus })
  }

  const deleteRecurring = async (id) => {
    if (isDemo) {
      const updated = recurringList.filter((item) => item.id !== id)
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }

    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw error
      setRecurringList((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete in Supabase, updating local state:', err)
      const updated = recurringList.filter((item) => item.id !== id)
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  }

  return {
    recurringList,
    loading,
    addRecurring,
    updateRecurring,
    toggleStatus,
    deleteRecurring,
    refresh: fetchRecurring,
  }
}
