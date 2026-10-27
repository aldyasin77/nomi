import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { INITIAL_WALLETS } from '../lib/mockData'

const STORAGE_KEY = 'nomi_demo_wallets'

function getInitialDemoWallets() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return INITIAL_WALLETS
}

export function useWallets() {
  const { user } = useAuth()
  const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)
  const [wallets, setWallets] = useState(() => isDemo ? getInitialDemoWallets() : [])
  const [loading, setLoading] = useState(true)

  const fetchWallets = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      setWallets(getInitialDemoWallets())
      setLoading(false)
      return
    }

    let { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (error && error.message && error.message.includes('sort_order')) {
      // Graceful fallback if user has not run the SQL migration yet
      const fallback = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: true })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Error fetching wallets:', error)
      setWallets([])
    } else {
      setWallets(data || [])
    }
    setLoading(false)
  }, [isDemo])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  const addWallet = async (wallet) => {
    if (isDemo) {
      const newWallet = {
        ...wallet,
        id: `w-${Date.now()}`,
        balance: parseFloat(wallet.balance) || 0,
        annual_interest_rate: parseFloat(wallet.annual_interest_rate) || 0,
        interest_payout_date: wallet.interest_payout_date || null,
        card_theme: wallet.card_theme || 'aurora',
        bank_logo: wallet.bank_logo || null,
        created_at: new Date().toISOString(),
      }
      const updated = [...wallets, newWallet]
      setWallets(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newWallet
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          ...wallet,
          user_id: user?.id,
        }])
        .select()
        .single()
      
      if (error) throw error
      setWallets(prev => [...prev, data])
      return data
    } catch (err) {
      // If bank_logo or interest_payout_date or type constraint fails in Supabase, retry with sanitized payload
      if (
        err.message &&
        (err.message.includes('bank_logo') ||
          err.message.includes('interest_payout_date') ||
          err.message.includes('wallets_type_check') ||
          err.message.includes('check constraint'))
      ) {
        const sanitized = { ...wallet }
        if (err.message.includes('bank_logo')) delete sanitized.bank_logo
        if (err.message.includes('interest_payout_date')) delete sanitized.interest_payout_date
        if (err.message.includes('wallets_type_check') || err.message.includes('check constraint')) {
          if (['credit_card', 'paylater'].includes(sanitized.type)) sanitized.type = 'bank'
          else if (['investment', 'p2p'].includes(sanitized.type)) sanitized.type = 'savings'
          else sanitized.type = 'cash'
        }
        const { data, error } = await supabase
          .from('wallets')
          .insert([{
            ...sanitized,
            user_id: user?.id,
          }])
          .select()
          .single()
        if (error) throw error
        setWallets(prev => [...prev, data])
        return data
      }
      throw err
    }
  }

  const updateWallet = async (id, updates) => {
    if (isDemo) {
      const updated = wallets.map(w => w.id === id ? { ...w, ...updates } : w)
      setWallets(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated.find(w => w.id === id)
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      setWallets(prev => prev.map(w => w.id === id ? data : w))
      return data
    } catch (err) {
      if (
        err.message &&
        (err.message.includes('bank_logo') ||
          err.message.includes('interest_payout_date') ||
          err.message.includes('wallets_type_check') ||
          err.message.includes('check constraint'))
      ) {
        const sanitized = { ...updates }
        if (err.message.includes('bank_logo')) delete sanitized.bank_logo
        if (err.message.includes('interest_payout_date')) delete sanitized.interest_payout_date
        if (err.message.includes('wallets_type_check') || err.message.includes('check constraint')) {
          if (['credit_card', 'paylater'].includes(sanitized.type)) sanitized.type = 'bank'
          else if (['investment', 'p2p'].includes(sanitized.type)) sanitized.type = 'savings'
          else sanitized.type = 'cash'
        }
        const { data, error } = await supabase
          .from('wallets')
          .update(sanitized)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        setWallets(prev => prev.map(w => w.id === id ? data : w))
        return data
      }
      throw err
    }
  }

  const deleteWallet = async (id) => {
    if (isDemo) {
      const updated = wallets.filter(w => w.id !== id)
      setWallets(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }

    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    setWallets(prev => prev.filter(w => w.id !== id))
  }

  const reorderWallets = async (newOrderedWallets) => {
    // Optimistic UI update
    setWallets(newOrderedWallets)

    if (isDemo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrderedWallets))
      return
    }

    try {
      const updates = newOrderedWallets.map((w, index) => ({
        id: w.id,
        sort_order: index,
      }))

      // Batch update sort_order to Supabase
      const { error } = await supabase
        .from('wallets')
        .upsert(updates, { onConflict: 'id' })

      if (error) {
        // Fallback to update per wallet in case upsert requires all columns
        await Promise.all(
          updates.map(({ id, sort_order }) =>
            supabase.from('wallets').update({ sort_order }).eq('id', id)
          )
        )
      }
    } catch (err) {
      console.error('Failed to save wallet order to Supabase:', err)
      fetchWallets()
      throw err
    }
  }

  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0)

  return {
    wallets,
    loading,
    totalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    reorderWallets,
    refetch: fetchWallets,
  }
}
