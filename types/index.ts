// TypeScript type definitions for Firestore documents and app data structures

import { Timestamp } from 'firebase/firestore'

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  householdId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Household Types
// ============================================================================

export type HouseholdRole = 'owner' | 'admin' | 'member'

export interface HouseholdMember {
  userId: string
  email: string
  displayName: string
  role: HouseholdRole
  joinedAt: Timestamp
}

export interface Household {
  id: string
  name: string
  ownerId: string
  members: HouseholdMember[]
  showMemberTransactions?: Record<string, boolean> // userId -> enabled
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionType = 'expense' | 'income'
export type TransactionTarget = 'personal' | 'household' | 'shared'

export interface SplitRule {
  userId: string
  percentage: number // 0-100
}

export interface Transaction {
  id: string
  householdId: string
  type: TransactionType
  title: string
  amount: number // In BRL cents to avoid floating point issues
  date: Timestamp
  category: string
  notes?: string
  payerId: string // User who made the transaction
  createdBy: string // User ID who created the transaction (for privacy control)
  target: TransactionTarget
  sharedWith?: SplitRule[] // Only for 'shared' transactions
  isHouseholdExpense?: boolean // If true, visible to all household members
  sharedWithUsers?: string[] // Array of user IDs who can see this personal transaction
  accountId?: string // Bank account used for payment
  creditCardId?: string // Credit card used for payment
  isPaid: boolean // Whether the transaction has been paid (for future dates)
  receiptImageUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Invitation Types
// ============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface Invitation {
  id: string
  householdId: string
  householdName: string
  invitedEmail: string
  inviterId: string
  inviterName: string
  token: string // Unique invitation token
  status: InvitationStatus
  expiresAt: Timestamp
  createdAt: Timestamp
  acceptedAt?: Timestamp
}

// ============================================================================
// Account Types (Bank Accounts)
// ============================================================================

export type AccountType = 'checking' | 'savings' | 'investment' | 'cash'

export interface Account {
  id: string
  householdId: string
  name: string
  type: AccountType
  balance: number // In BRL cents
  initialBalance: number // In BRL cents
  color: string
  icon: string
  isActive: boolean
  ownerId: string // User who created the account
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AccountFormData {
  name: string
  type: AccountType
  initialBalance: string
  color: string
  icon: string
}

// ============================================================================
// Credit Card Types
// ============================================================================

export interface CreditCard {
  id: string
  householdId: string
  name: string
  lastFourDigits: string
  limit: number // In BRL cents
  closingDay: number // Day of month (1-31)
  dueDay: number // Day of month (1-31)
  color: string
  icon: string
  isActive: boolean
  ownerId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreditCardFormData {
  name: string
  lastFourDigits: string
  limit: string
  closingDay: number
  dueDay: number
  color: string
  icon: string
}

// ============================================================================
// Credit Card Bill Types
// ============================================================================

export type BillStatus = 'open' | 'closed' | 'paid' | 'overdue'

export interface CreditCardBill {
  id: string
  creditCardId: string
  householdId: string
  userId: string
  closingDate: Timestamp // Data de fechamento da fatura
  dueDate: Timestamp // Data de vencimento
  totalAmount: number // Total da fatura em centavos
  paidAmount: number // Valor já pago
  status: BillStatus
  transactions: string[] // IDs das transações incluídas
  paymentAccountId?: string // Conta usada para pagar
  paidAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface BillFormData {
  paymentAccountId: string
  amount: string
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income' | 'both'
}

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentação', icon: '🍽️', color: '#ef4444', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#f59e0b', type: 'expense' },
  { id: 'housing', name: 'Moradia', icon: '🏠', color: '#3b82f6', type: 'expense' },
  { id: 'utilities', name: 'Contas', icon: '💡', color: '#8b5cf6', type: 'expense' },
  { id: 'healthcare', name: 'Saúde', icon: '⚕️', color: '#ec4899', type: 'expense' },
  { id: 'education', name: 'Educação', icon: '📚', color: '#6366f1', type: 'expense' },
  { id: 'entertainment', name: 'Lazer', icon: '🎮', color: '#14b8a6', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#f97316', type: 'expense' },
  { id: 'salary', name: 'Salário', icon: '💰', color: '#22c55e', type: 'income' },
  { id: 'bonus', name: 'Bônus', icon: '🎁', color: '#10b981', type: 'income' },
  { id: 'investment', name: 'Investimento', icon: '📈', color: '#059669', type: 'income' },
  { id: 'other', name: 'Outro', icon: '📝', color: '#64748b', type: 'both' },
]

// ============================================================================
// Balance/Summary Types
// ============================================================================

export interface Balance {
  personal: {
    income: number
    expenses: number
    balance: number
  }
  household: {
    income: number
    expenses: number
    balance: number
  }
  total: {
    income: number
    expenses: number
    balance: number
  }
}

export interface MonthlyData {
  month: string // YYYY-MM format
  income: number
  expenses: number
  balance: number
}

// ============================================================================
// Form Types
// ============================================================================

export interface TransactionFormData {
  type: TransactionType
  title: string
  amount: string // String for form input
  date: string // ISO date string
  category: string
  notes?: string
  target: TransactionTarget
  sharedWith?: SplitRule[]
  isHouseholdExpense?: boolean
  sharedWithUsers?: string[]
  accountId?: string
  creditCardId?: string
  isPaid?: boolean
}

export interface HouseholdFormData {
  name: string
}

export interface InviteFormData {
  email: string
}
