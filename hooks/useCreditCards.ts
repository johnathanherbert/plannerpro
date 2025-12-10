'use client'

import { useState, useEffect } from 'react'
import { CreditCard } from '@/types'
import { subscribeToCreditCards } from '@/services/creditCards'

interface UseCreditCardsReturn {
  creditCards: CreditCard[]
  loading: boolean
  error: string | null
}

/**
 * Hook to subscribe to credit cards with realtime updates
 * Returns only cards owned by the specified user
 */
export function useCreditCards(householdId: string | undefined, userId: string | undefined): UseCreditCardsReturn {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!householdId || !userId) {
      setCreditCards([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToCreditCards(householdId, userId, (updatedCards) => {
      setCreditCards(updatedCards)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [householdId, userId])

  return { creditCards, loading, error }
}
