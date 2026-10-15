import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Strip trailing /rest/v1 or trailing slashes if accidentally included
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
const supabaseAnonKey = rawKey.trim()

const isMissing = !supabaseUrl || supabaseUrl === 'your-supabase-url-here' ||
                  !supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key-here'

if (isMissing) {
  console.warn(
    '⚠️ Supabase credentials missing or placeholder. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart the dev server.'
  )
}

export const supabase = createClient(
  !isMissing ? supabaseUrl : 'https://placeholder.supabase.co',
  !isMissing ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'
)

export const isSupabaseConfigured = !isMissing
