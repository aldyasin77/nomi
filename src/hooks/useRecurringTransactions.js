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
        setRecurringList(data || [])
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
    const payload = {
      ...item,
      amount: parseFloat(item.amount) || 0,
      execution_day: parseInt(item.execution_day, 10) || 1,
      is_active: item.is_active ?? true,
      note: item.note || '',
      type: item.type || 'expense',
      wallet_id: item.wallet_id || null,
      to_wallet_id: item.to_wallet_id || null,
      category_id: item.category_id || null,
    }

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
    const cleanUpdates = {
      ...updates,
      ...(updates.amount !== undefined ? { amount: parseFloat(updates.amount) || 0 } : {}),
      ...(updates.execution_day !== undefined ? { execution_day: parseInt(updates.execution_day, 10) || 1 } : {}),
    }

    if (isDemo) {
      const updated = recurringList.map((item) => (item.id === id ? { ...item, ...cleanUpdates } : item))
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update(cleanUpdates)
        .eq('id', id)

      if (error) throw error

      setRecurringList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...cleanUpdates } : item))
      )
    } catch (err) {
      console.error('Failed to update in Supabase, updating local state:', err)
      const updated = recurringList.map((item) => (item.id === id ? { ...item, ...cleanUpdates } : item))
      setRecurringList(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
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
