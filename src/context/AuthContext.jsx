import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      const savedDemo = localStorage.getItem('nomi_demo_user')
      if (savedDemo) {
        try { setUser(JSON.parse(savedDemo)) } catch (e) {}
      }
      setLoading(false)
      return
    }

    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        // Clear any leftover demo user if a real session exists
        localStorage.removeItem('nomi_demo_user')
        setUser(session.user)
      } else {
        // Fallback to demo user only if actively selected
        const savedDemo = localStorage.getItem('nomi_demo_user')
        if (savedDemo) {
          try { setUser(JSON.parse(savedDemo)) } catch (e) {}
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    }).catch((err) => {
      console.error('Session fetch error:', err)
      if (mounted) setLoading(false)
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        if (session?.user) {
          localStorage.removeItem('nomi_demo_user')
          setUser(session.user)
        } else {
          // If no session and not demo, user is logged out
          const savedDemo = localStorage.getItem('nomi_demo_user')
          if (savedDemo) {
            try { setUser(JSON.parse(savedDemo)) } catch (e) {}
          } else {
            setUser(null)
          }
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const enterDemoMode = () => {
    const demoUser = {
      id: 'demo-user-001',
      email: 'alex@nomi.app',
      user_metadata: { full_name: 'Alex Tan' },
      isDemo: true,
    }
    localStorage.setItem('nomi_demo_user', JSON.stringify(demoUser))
    setUser(demoUser)
    return demoUser
  }

  const signUp = async (email, password, extraOptions = {}) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
    localStorage.removeItem('nomi_demo_user')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...extraOptions,
    })
    if (error) throw error
    if (data?.user) setUser(data.user)
    return data
  }

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
    localStorage.removeItem('nomi_demo_user')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user) setUser(data.user)
    return data
  }

  const signOut = async () => {
    localStorage.removeItem('nomi_demo_user')
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {})
    }
    setUser(null)
  }

  const value = {
    user,
    loading,
    enterDemoMode,
    signUp,
    signIn,
    signOut,
    isConfigured: isSupabaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
