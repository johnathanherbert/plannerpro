'use client'

import { useState, useEffect } from 'react'
import { Account } from '@/types'
import { subscribeToAccounts } from '@/services/accounts'

interface UseAccountsReturn {
  accounts: Account[]
  loading: boolean
  error: string | null
  totalBalance: number
}

/**
 * Hook to subscribe to accounts with realtime updates
 * Returns only accounts owned by the specified user
 */
export function useAccounts(householdId: string | undefined, userId: string | undefined): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!householdId || !userId) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToAccounts(householdId, userId, (updatedAccounts) => {
      setAccounts(updatedAccounts)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [householdId, userId])

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return { accounts, loading, error, totalBalance }
}
