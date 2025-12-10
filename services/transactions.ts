// Firestore service - CRUD operations for transactions
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
  deleteField,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Transaction, TransactionFormData } from '@/types'
import { adjustAccountBalance } from './accounts'

const TRANSACTIONS_COLLECTION = 'transactions'

/**
 * Creates a new transaction
 */
export async function createTransaction(
  data: TransactionFormData,
  userId: string,
  householdId: string
): Promise<string> {
  try {
    // Convert amount from string to cents (integer)
    const amountInCents = Math.round(parseFloat(data.amount) * 100)
    
    // Determine if transaction should be marked as paid
    const transactionDate = new Date(data.date)
    const today = new Date()
    const isFutureDate = transactionDate > today
    const isPaid = data.isPaid !== undefined ? data.isPaid : !isFutureDate

    const transactionData: Omit<Transaction, 'id'> = {
      householdId,
      type: data.type,
      title: data.title,
      amount: amountInCents,
      date: Timestamp.fromDate(transactionDate),
      category: data.category,
      notes: data.notes,
      payerId: userId,
      createdBy: userId, // Track who created the transaction
      target: data.target,
      isPaid,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    // Add optional fields
    if (data.sharedWith && data.sharedWith.length > 0) {
      transactionData.sharedWith = data.sharedWith
    }
    
    // Add household expense flag
    if (data.isHouseholdExpense !== undefined) {
      transactionData.isHouseholdExpense = data.isHouseholdExpense
      console.log('💾 Saving isHouseholdExpense:', {
        value: data.isHouseholdExpense,
        type: typeof data.isHouseholdExpense,
        strictCheck: data.isHouseholdExpense === true
      })
    }
    
    // Add shared with users
    if (data.sharedWithUsers && data.sharedWithUsers.length > 0) {
      transactionData.sharedWithUsers = data.sharedWithUsers
      console.log('💾 Saving sharedWithUsers:', data.sharedWithUsers)
    }
    
    if (data.accountId) {
      transactionData.accountId = data.accountId
      console.log('💳 Saving with accountId:', data.accountId)
    }
    
    if (data.creditCardId) {
      transactionData.creditCardId = data.creditCardId
      console.log('💳 Saving with creditCardId:', data.creditCardId)
    }

    console.log('📝 Complete transaction data:', transactionData)

    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData)
    
    // Adjust account balance if transaction is paid and has an account
    if (isPaid && data.accountId && !data.creditCardId) {
      const balanceChange = data.type === 'income' ? amountInCents : -amountInCents
      await adjustAccountBalance(data.accountId, balanceChange)
    }
    
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar transação')
  }
}

/**
 * Updates an existing transaction
 * Handles balance adjustments when changing payment method
 */
export async function updateTransaction(
  transactionId: string,
  data: Partial<TransactionFormData>
): Promise<void> {
  try {
    // Get the original transaction to compare payment methods
    const originalTransaction = await getTransaction(transactionId)
    if (!originalTransaction) {
      throw new Error('Transação não encontrada')
    }

    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    // Only add defined fields to updateData
    if (data.type !== undefined) updateData.type = data.type
    if (data.title !== undefined) updateData.title = data.title
    if (data.category !== undefined) updateData.category = data.category
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.target !== undefined) updateData.target = data.target
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid
    if (data.isHouseholdExpense !== undefined) updateData.isHouseholdExpense = data.isHouseholdExpense
    
    // Convert amount if provided
    let newAmountInCents = originalTransaction.amount
    if (data.amount !== undefined) {
      newAmountInCents = Math.round(parseFloat(data.amount) * 100)
      updateData.amount = newAmountInCents
    }

    // Convert date if provided
    if (data.date !== undefined) {
      updateData.date = Timestamp.fromDate(new Date(data.date))
    }

    // Handle sharedWith field - remove if undefined or empty
    if (data.target === 'personal' || data.target === 'household') {
      // Remove sharedWith field when changing from shared to personal/household
      updateData.sharedWith = deleteField()
    } else if (data.sharedWith && data.sharedWith.length > 0) {
      // Only add sharedWith if it's defined and not empty
      updateData.sharedWith = data.sharedWith
    }

    // Handle sharedWithUsers array
    if (data.sharedWithUsers !== undefined) {
      if (data.sharedWithUsers.length > 0) {
        updateData.sharedWithUsers = data.sharedWithUsers
        console.log('💾 Updating sharedWithUsers:', data.sharedWithUsers)
      } else {
        updateData.sharedWithUsers = deleteField()
        console.log('🗑️ Removing sharedWithUsers (empty array)')
      }
    }

    // Determine old and new payment methods
    const oldAccountId = originalTransaction.accountId
    const oldCreditCardId = originalTransaction.creditCardId
    const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId
    const newCreditCardId = data.creditCardId !== undefined ? data.creditCardId : oldCreditCardId
    
    // Get transaction type for balance calculation
    const transactionType = data.type !== undefined ? data.type : originalTransaction.type
    const isPaid = data.isPaid !== undefined ? data.isPaid : originalTransaction.isPaid

    // Only adjust balances if transaction is paid and not on credit card
    if (isPaid && !oldCreditCardId && !newCreditCardId) {
      // If changing from one account to another
      if (oldAccountId && newAccountId && oldAccountId !== newAccountId) {
        // Reverse the old account transaction
        const reverseAmount = transactionType === 'income' ? -newAmountInCents : newAmountInCents
        await adjustAccountBalance(oldAccountId, reverseAmount)
        
        // Apply to new account
        const newAmount = transactionType === 'income' ? newAmountInCents : -newAmountInCents
        await adjustAccountBalance(newAccountId, newAmount)
      }
      // If removing account (changing to cash/no account)
      else if (oldAccountId && !newAccountId) {
        // Reverse the old account transaction
        const reverseAmount = transactionType === 'income' ? -newAmountInCents : newAmountInCents
        await adjustAccountBalance(oldAccountId, reverseAmount)
      }
      // If adding account (was cash/no account before)
      else if (!oldAccountId && newAccountId) {
        // Apply to new account
        const newAmount = transactionType === 'income' ? newAmountInCents : -newAmountInCents
        await adjustAccountBalance(newAccountId, newAmount)
      }
      // If same account but amount changed
      else if (oldAccountId && newAccountId === oldAccountId && data.amount !== undefined) {
        const oldAmount = originalTransaction.amount
        const difference = newAmountInCents - oldAmount
        const balanceChange = transactionType === 'income' ? difference : -difference
        await adjustAccountBalance(oldAccountId, balanceChange)
      }
    }

    // Handle accountId - set or remove
    if (data.accountId !== undefined) {
      if (data.accountId) {
        updateData.accountId = data.accountId
      } else {
        updateData.accountId = deleteField()
      }
    }

    // Handle creditCardId - set or remove
    if (data.creditCardId !== undefined) {
      if (data.creditCardId) {
        updateData.creditCardId = data.creditCardId
      } else {
        updateData.creditCardId = deleteField()
      }
    }

    await updateDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId), updateData)
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar transação')
  }
}

/**
 * Deletes a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId))
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao deletar transação')
  }
}

/**
 * Gets a single transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const docSnap = await getDoc(doc(db, TRANSACTIONS_COLLECTION, transactionId))
    
    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Transaction
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar transação')
  }
}

/**
 * Subscribes to realtime transactions for a household
 * Returns unsubscribe function
 * 
 * Privacy rules:
 * - User sees their own transactions (createdBy === currentUserId)
 * - User sees household expenses (isHouseholdExpense === true)
 * - User sees transactions shared with them (sharedWithUsers includes currentUserId)
 * - User sees other members' transactions if both enabled showMemberTransactions
 */
export function subscribeToTransactions(
  householdId: string,
  currentUserId: string,
  callback: (transactions: Transaction[]) => void,
  options?: {
    startDate?: Date
    endDate?: Date
    category?: string
    type?: 'income' | 'expense'
    userId?: string
    showMemberTransactions?: Record<string, boolean> // From household settings
    filterBy?: 'mine' | 'household' | 'all' | string // string = specific userId
  }
): () => void {
  try {
    const constraints: QueryConstraint[] = [
      where('householdId', '==', householdId),
      // orderBy('date', 'desc'), // Temporarily disabled while index is building
    ]

    // Add optional filters
    if (options?.type) {
      constraints.push(where('type', '==', options.type))
    }
    if (options?.category) {
      constraints.push(where('category', '==', options.category))
    }

    const q = query(collection(db, TRANSACTIONS_COLLECTION), ...constraints)

    return onSnapshot(
      q,
      (snapshot) => {
        const allTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]

      console.log('📊 Transactions from Firestore:', allTransactions.map(t => ({
        id: t.id,
        title: t.title,
        isHouseholdExpense: t.isHouseholdExpense,
        sharedWithUsers: t.sharedWithUsers,
        createdBy: t.createdBy
      })))

      // Apply privacy filter
      let filtered = allTransactions.filter((transaction) => {
        // 1. User's own transactions
        if (transaction.createdBy === currentUserId) return true
        
        // 2. Household expenses (visible to all) - either isHouseholdExpense flag OR target='household'
        if (transaction.isHouseholdExpense === true || transaction.target === 'household') {
          console.log('✅ Showing household expense:', transaction.title, transaction.id, {
            isHouseholdExpense: transaction.isHouseholdExpense,
            target: transaction.target
          })
          return true
        }
        
        // 3. Transactions explicitly shared with this user
        if (transaction.sharedWithUsers?.includes(currentUserId)) {
          console.log('✅ Showing shared transaction:', transaction.title, 'sharedWith:', transaction.sharedWithUsers)
          return true
        }
        
        // 4. Other members' transactions (if both users enabled sharing)
        const creatorEnabled = options?.showMemberTransactions?.[transaction.createdBy]
        const viewerEnabled = options?.showMemberTransactions?.[currentUserId]
        if (creatorEnabled && viewerEnabled) return true
        
        return false
      })

      // Apply additional filters
      if (options?.filterBy === 'mine') {
        filtered = filtered.filter((t) => t.createdBy === currentUserId)
      } else if (options?.filterBy === 'household') {
        filtered = filtered.filter((t) => t.isHouseholdExpense === true)
      } else if (options?.filterBy && options.filterBy !== 'all') {
        // Filter by specific user
        filtered = filtered.filter((t) => t.createdBy === options.filterBy)
      }

      if (options?.userId) {
        filtered = filtered.filter((t) => t.payerId === options.userId)
      }

      // Apply date filters in memory
      if (options?.startDate) {
        filtered = filtered.filter((t) => t.date.toDate() >= options.startDate!)
      }
      if (options?.endDate) {
        filtered = filtered.filter((t) => t.date.toDate() <= options.endDate!)
      }

      // Sort by date descending in memory (while index is building)
      filtered.sort((a, b) => b.date.toMillis() - a.date.toMillis())

      callback(filtered)
    },
    (error) => {
      console.error('[subscribeToTransactions] Error in snapshot listener:', error)
      callback([]) // Return empty array on error
    })
  } catch (error: any) {
    console.error('Error subscribing to transactions:', error)
    return () => {}
  }
}

/**
 * Uploads receipt image to Firebase Storage
 * @returns Download URL
 */
export async function uploadReceipt(file: File, transactionId: string): Promise<string> {
  // TODO: Implement Firebase Storage upload
  // For now, return placeholder
  return `https://placeholder.com/receipt/${transactionId}`
}
