'use client'

import { useState, useEffect } from 'react'
import { CreditCardBill, CreditCard } from '@/types'
import { subscribeToBills, getCurrentBill, getCreditCardUsage, calculateBillingPeriod, updateBillTotal } from '@/services/creditCardBills'

interface UseCreditCardBillReturn {
  currentBill: CreditCardBill | null
  allBills: CreditCardBill[]
  currentUsage: number
  availableLimit: number
  loading: boolean
  error: string | null
}

/**
 * Hook to subscribe to credit card bills with realtime updates
 * Calculates current usage and available limit
 */
export function useCreditCardBill(
  creditCard: CreditCard | undefined,
  userId: string | undefined
): UseCreditCardBillReturn {
  const [currentBill, setCurrentBill] = useState<CreditCardBill | null>(null)
  const [allBills, setAllBills] = useState<CreditCardBill[]>([])
  const [currentUsage, setCurrentUsage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!creditCard || !userId) {
      setCurrentBill(null)
      setAllBills([])
      setCurrentUsage(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Subscribe to all bills for this card
    const unsubscribe = subscribeToBills(creditCard.id, userId, (bills) => {
      setAllBills(bills)
      setLoading(false)
    })

    // Get or create current bill
    getCurrentBill(creditCard, userId)
      .then((bill) => {
        console.log('[useCreditCardBill] Current bill:', bill)
        setCurrentBill(bill)
        
        // Calculate current period usage in real-time
        const { startDate, endDate } = calculateBillingPeriod(
          creditCard.closingDay,
          creditCard.dueDay
        )
        
        console.log('[useCreditCardBill] Calculating usage for period:', { startDate, endDate })
        return getCreditCardUsage(creditCard.id, userId, startDate, endDate)
          .then(({ total, transactions }) => ({ bill, total, transactions }))
      })
      .then(({ bill, total, transactions }) => {
        console.log('[useCreditCardBill] Usage calculated:', total)
        
        // Calculate actual usage: total transactions minus what's already paid
        const actualUsage = bill ? total - bill.paidAmount : total
        console.log('[useCreditCardBill] Actual usage after payments:', actualUsage, 
          '(total:', total, '- paid:', bill?.paidAmount || 0, ')')
        setCurrentUsage(actualUsage)
        
        // Update bill if total changed
        if (bill && bill.totalAmount !== total) {
          console.log('[useCreditCardBill] Updating bill total from', bill.totalAmount, 'to', total)
          updateBillTotal(bill.id, total, transactions.map(t => t.id))
            .catch(err => console.error('[useCreditCardBill] Error updating bill:', err))
        }
      })
      .catch((err) => {
        console.error('[useCreditCardBill] Error:', err)
        setError(err.message)
        setLoading(false)
      })

    return () => unsubscribe()
  }, [creditCard?.id, userId])

  const availableLimit = creditCard ? creditCard.limit - currentUsage : 0

  return {
    currentBill,
    allBills,
    currentUsage,
    availableLimit,
    loading,
    error,
  }
}

/**
 * Hook to get all bills for a user across all credit cards
 */
export function useUserBills(userId: string | undefined) {
  const [bills, setBills] = useState<CreditCardBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setBills([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { subscribeToUserBills } = require('@/services/creditCardBills')
    
    const unsubscribe = subscribeToUserBills(userId, (userBills: CreditCardBill[]) => {
      setBills(userBills)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  return { bills, loading, error }
}
