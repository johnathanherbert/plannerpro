'use client'

// Transactions hook - manages transactions with realtime updates and filtering
import { useState, useEffect } from 'react'
import { Transaction, MonthlyData, Balance } from '@/types'
import { subscribeToTransactions } from '@/services/transactions'
import { calculateBalance } from '@/utils/splitLogic'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

interface UseTransactionsOptions {
  startDate?: Date
  endDate?: Date
  category?: string
  type?: 'income' | 'expense'
  userId?: string
  showMemberTransactions?: Record<string, boolean>
  filterBy?: 'mine' | 'household' | 'all' | string
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  balance: Balance | null
  monthlyData: MonthlyData[]
}

/**
 * Hook to subscribe to transactions with realtime updates
 * Automatically calculates balances and monthly summaries
 */
export function useTransactions(
  householdId: string | undefined,
  userId: string | undefined,
  options?: UseTransactionsOptions
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  useEffect(() => {
    if (!householdId || !userId) {
      setTransactions([])
      setBalance(null)
      setMonthlyData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Subscribe to transactions with realtime updates
    const unsubscribe = subscribeToTransactions(
      householdId,
      userId,
      (updatedTransactions) => {
        setTransactions(updatedTransactions)
        
        // Calculate balance
        const calculatedBalance = calculateBalance(updatedTransactions, userId, householdId)
        setBalance(calculatedBalance)
        
        // Calculate monthly data for charts
        const monthly = calculateMonthlyData(updatedTransactions)
        setMonthlyData(monthly)
        
        setLoading(false)
      },
      options
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [householdId, userId, options?.startDate, options?.endDate, options?.category, options?.type, options?.userId])

  return { transactions, loading, error, balance, monthlyData }
}

/**
 * Calculates monthly income/expense data for charts
 */
function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  const monthlyMap = new Map<string, MonthlyData>()

  transactions.forEach((transaction) => {
    const date = transaction.date.toDate()
    const monthKey = format(date, 'yyyy-MM')
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        income: 0,
        expenses: 0,
        balance: 0,
      })
    }

    const monthData = monthlyMap.get(monthKey)!
    const amount = transaction.amount / 100 // Convert cents to BRL

    if (transaction.type === 'income') {
      monthData.income += amount
    } else {
      monthData.expenses += amount
    }
    
    monthData.balance = monthData.income - monthData.expenses
  })

  // Convert to array and sort by month
  return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}
