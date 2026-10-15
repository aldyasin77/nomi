import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { INITIAL_CATEGORIES } from '../lib/mockData'

const STORAGE_KEY = 'nomi_demo_categories'

function getInitialDemoCategories() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return INITIAL_CATEGORIES
}

export function useCategories() {
  const { user } = useAuth()
  const isDemo = !isSupabaseConfigured || Boolean(user?.isDemo)
  const [categories, setCategories] = useState(() => isDemo ? getInitialDemoCategories() : [])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      setCategories(getInitialDemoCategories())
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }, [isDemo])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (category) => {
    if (isDemo) {
      const newCat = {
        ...category,
        id: `c-${Date.now()}`,
        monthly_limit: parseFloat(category.monthly_limit) || 0,
      }
      const updated = [...categories, newCat]
      setCategories(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return newCat
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        ...category,
        user_id: user?.id,
      }])
      .select()
      .single()
    
    if (error) throw error
    setCategories(prev => [...prev, data])
    return data
  }

  const updateCategory = async (id, updates) => {
    if (isDemo) {
      const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c)
      setCategories(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated.find(c => c.id === id)
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteCategory = async (id) => {
    if (isDemo) {
      const updated = categories.filter(c => c.id !== id)
      setCategories(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
