'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  onboardingCompleted: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  onboardingCompleted: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  // Fetch onboarding status - separated from auth listener
  const fetchOnboardingStatus = useCallback(async (userId: string) => {
    console.log('[AuthContext] Fetching onboarding for:', userId)

    // Add timeout to prevent infinite hang
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.error('[AuthContext] DB error:', error)
        // Default to true if we can't fetch - let the page handle it
        return true
      }

      console.log('[AuthContext] Onboarding result:', data?.onboarding_completed)
      return data?.onboarding_completed ?? false
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error?.name === 'AbortError') {
        console.error('[AuthContext] DB query timed out after 5s')
      } else {
        console.error('[AuthContext] Error:', error)
      }
      // Default to true on error - let the page handle it
      return true
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth event:', event, 'User:', session?.user?.id ?? 'none')

        if (!mounted) return

        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          // Fetch onboarding in background, don't block
          fetchOnboardingStatus(newUser.id).then((onboarding) => {
            if (mounted) {
              setOnboardingCompleted(onboarding)
              setLoading(false)
              console.log('[AuthContext] Complete - onboarding:', onboarding)
            }
          })
        } else {
          setOnboardingCompleted(false)
          setLoading(false)
          console.log('[AuthContext] No user, complete')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchOnboardingStatus])

  return (
    <AuthContext.Provider value={{ user, loading, onboardingCompleted }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
