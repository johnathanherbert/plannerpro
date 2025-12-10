// Split logic utilities for shared transactions
import { Transaction, SplitRule, Balance } from '@/types'

/**
 * Calculates how much each user owes/receives in a shared transaction
 * @param transaction - The transaction to split
 * @returns Map of userId to amount (positive = owes, negative = receives)
 */
export function calculateSplit(transaction: Transaction): Map<string, number> {
  const splits = new Map<string, number>()

  if (transaction.target !== 'shared' || !transaction.sharedWith) {
    return splits
  }

  const totalAmount = transaction.amount / 100 // Convert cents to BRL

  // Validate percentages sum to 100
  const totalPercentage = transaction.sharedWith.reduce((sum, rule) => sum + rule.percentage, 0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    console.warn('Split percentages do not sum to 100%', transaction.id)
  }

  // Calculate each person's share
  transaction.sharedWith.forEach((rule) => {
    const amount = (totalAmount * rule.percentage) / 100
    
    if (transaction.type === 'expense') {
      // For expenses, everyone except the payer owes money
      if (rule.userId === transaction.payerId) {
        splits.set(rule.userId, -amount) // Payer is owed this amount
      } else {
        splits.set(rule.userId, amount) // Others owe this amount
      }
    } else {
      // For income, everyone except the receiver gets money
      if (rule.userId === transaction.payerId) {
        splits.set(rule.userId, amount) // Receiver gets this amount
      } else {
        splits.set(rule.userId, -amount) // Others pay this amount
      }
    }
  })

  return splits
}

/**
 * Creates equal split rules for multiple users
 * @param userIds - Array of user IDs to split between
 * @returns Array of split rules with equal percentages
 */
export function createEqualSplit(userIds: string[]): SplitRule[] {
  const percentage = 100 / userIds.length
  return userIds.map((userId) => ({
    userId,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
  }))
}

/**
 * Calculates balances from a list of transactions
 * @param transactions - List of transactions
 * @param userId - User ID to calculate balance for
 * @param householdId - Household ID
 * @returns Balance object with personal, household, and total balances
 */
export function calculateBalance(
  transactions: Transaction[],
  userId: string,
  householdId: string
): Balance {
  const balance: Balance = {
    personal: { income: 0, expenses: 0, balance: 0 },
    household: { income: 0, expenses: 0, balance: 0 },
    total: { income: 0, expenses: 0, balance: 0 },
  }

  transactions.forEach((transaction) => {
    const amountInBRL = transaction.amount / 100

    if (transaction.target === 'personal' && transaction.payerId === userId) {
      // Personal transaction
      if (transaction.type === 'income') {
        balance.personal.income += amountInBRL
      } else {
        balance.personal.expenses += amountInBRL
      }
    } else if (transaction.target === 'household') {
      // Household transaction (affects all members equally)
      if (transaction.type === 'income') {
        balance.household.income += amountInBRL
      } else {
        balance.household.expenses += amountInBRL
      }
    } else if (transaction.target === 'shared' && transaction.sharedWith) {
      // Shared transaction - calculate this user's portion
      const userSplit = transaction.sharedWith.find((s) => s.userId === userId)
      if (userSplit) {
        const userAmount = (amountInBRL * userSplit.percentage) / 100
        
        if (transaction.type === 'income') {
          balance.personal.income += userAmount
        } else {
          balance.personal.expenses += userAmount
        }
      }
    }
  })

  // Calculate net balances
  balance.personal.balance = balance.personal.income - balance.personal.expenses
  balance.household.balance = balance.household.income - balance.household.expenses
  balance.total.income = balance.personal.income + balance.household.income
  balance.total.expenses = balance.personal.expenses + balance.household.expenses
  balance.total.balance = balance.total.income - balance.total.expenses

  return balance
}

/**
 * Validates split rules
 * @param rules - Array of split rules
 * @returns Validation result with error message if invalid
 */
export function validateSplitRules(rules: SplitRule[]): { valid: boolean; error?: string } {
  if (!rules || rules.length === 0) {
    return { valid: false, error: 'Pelo menos um membro deve ser selecionado' }
  }

  // Check percentages sum to 100
  const totalPercentage = rules.reduce((sum, rule) => sum + rule.percentage, 0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return { valid: false, error: 'As porcentagens devem somar 100%' }
  }

  // Check all percentages are positive
  if (rules.some((rule) => rule.percentage <= 0)) {
    return { valid: false, error: 'Todas as porcentagens devem ser maiores que zero' }
  }

  return { valid: true }
}
