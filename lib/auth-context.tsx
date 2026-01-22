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

    try {
      // Race between query and timeout
      const result = await Promise.race([
        supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', userId)
          .single(),
        new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ])

      if (result.error) {
        console.error('[AuthContext] DB error:', result.error)
        return true
      }

      console.log('[AuthContext] Onboarding result:', result.data?.onboarding_completed)
      return result.data?.onboarding_completed ?? false
    } catch (error: any) {
      console.error('[AuthContext] Error:', error?.message || error)
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
