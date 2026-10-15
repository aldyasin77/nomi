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

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true })
    
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
        created_at: new Date().toISOString(),
      }
      const updated = [...wallets, newWallet]
      setWallets(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newWallet
    }

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
  }

  const updateWallet = async (id, updates) => {
    if (isDemo) {
      const updated = wallets.map(w => w.id === id ? { ...w, ...updates } : w)
      setWallets(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated.find(w => w.id === id)
    }

    const { data, error } = await supabase
      .from('wallets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    setWallets(prev => prev.map(w => w.id === id ? data : w))
    return data
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

  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0)

  return {
    wallets,
    loading,
    totalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    refetch: fetchWallets,
  }
}
