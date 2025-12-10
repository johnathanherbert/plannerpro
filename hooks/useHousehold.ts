'use client'

// Household hook - manages household data with realtime updates
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Household } from '@/types'

interface UseHouseholdReturn {
  household: Household | null
  loading: boolean
  error: string | null
}

/**
 * Hook to subscribe to household data with realtime updates
 * @param householdId - ID of the household to subscribe to
 */
export function useHousehold(householdId: string | undefined): UseHouseholdReturn {
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!householdId) {
      setHousehold(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Subscribe to household document with realtime updates
    const unsubscribe = onSnapshot(
      doc(db, 'households', householdId),
      (snapshot) => {
        if (snapshot.exists()) {
          setHousehold({
            id: snapshot.id,
            ...snapshot.data(),
          } as Household)
        } else {
          setHousehold(null)
          setError('Casa não encontrada')
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Erro ao carregar casa')
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount or when householdId changes
    return () => unsubscribe()
  }, [householdId])

  return { household, loading, error }
}
