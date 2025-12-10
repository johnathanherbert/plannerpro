// Credit Card Bills service - manage credit card billing cycles and payments
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CreditCardBill, BillStatus, CreditCard, Transaction } from '@/types'
import { adjustAccountBalance } from './accounts'

const BILLS_COLLECTION = 'creditCardBills'
const TRANSACTIONS_COLLECTION = 'transactions'

// Cache to prevent duplicate bill creation during concurrent calls
const billCreationCache = new Map<string, Promise<CreditCardBill | null>>()

/**
 * Calculate billing period based on card's closing day
 * Returns { startDate, endDate, dueDate }
 */
export function calculateBillingPeriod(
  closingDay: number,
  dueDay: number,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date; dueDate: Date } {
  const now = referenceDate
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let closingMonth = currentMonth
  let closingYear = currentYear

  // If we're past the closing day, the current period already closed
  if (currentDay > closingDay) {
    closingMonth += 1
    if (closingMonth > 11) {
      closingMonth = 0
      closingYear += 1
    }
  }

  // End date is the closing day of the current/next month
  const endDate = new Date(closingYear, closingMonth, closingDay, 23, 59, 59)

  // Start date is the day after previous closing
  const startMonth = closingMonth - 1 < 0 ? 11 : closingMonth - 1
  const startYear = closingMonth - 1 < 0 ? closingYear - 1 : closingYear
  const startDate = new Date(startYear, startMonth, closingDay + 1, 0, 0, 0)

  // Due date is the dueDay after closing
  let dueMonth = closingMonth
  let dueYear = closingYear
  
  // If dueDay is before closingDay, it's in the next month
  if (dueDay <= closingDay) {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
  }
  
  const dueDate = new Date(dueYear, dueMonth, dueDay, 23, 59, 59)

  return { startDate, endDate, dueDate }
}

/**
 * Get credit card usage for a specific period
 * Sums all transactions made with the card in the period
 */
export async function getCreditCardUsage(
  creditCardId: string,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ total: number; transactions: Transaction[] }> {
  try {
    console.log('[getCreditCardUsage] Querying transactions for card:', creditCardId, 'user:', userId)
    console.log('[getCreditCardUsage] Period:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    })
    
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('createdBy', '==', userId),
      where('creditCardId', '==', creditCardId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    )

    const snapshot = await getDocs(q)
    console.log('[getCreditCardUsage] Found transactions:', snapshot.docs.length)
    
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[]

    console.log('[getCreditCardUsage] Transactions details:', transactions.map(t => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      date: t.date.toDate().toISOString()
    })))

    const total = transactions.reduce((sum, t) => sum + t.amount, 0)
    
    console.log('[getCreditCardUsage] Total usage:', total, '(R$', (total / 100).toFixed(2), ')')

    return { total, transactions }
  } catch (error: any) {
    console.error('[getCreditCardUsage] Error:', error)
    throw new Error(error.message || 'Erro ao calcular uso do cartão')
  }
}

/**
 * Generate or get current bill for a credit card
 * Creates a new bill if one doesn't exist for the current period
 */
export async function getCurrentBill(
  creditCard: CreditCard,
  userId: string
): Promise<CreditCardBill | null> {
  // Create a unique cache key for this bill query
  const { startDate, endDate } = calculateBillingPeriod(
    creditCard.closingDay,
    creditCard.dueDay
  )
  const cacheKey = `${creditCard.id}-${userId}-${endDate.getTime()}`
  
  // If there's already a pending request for this bill, return it
  if (billCreationCache.has(cacheKey)) {
    console.log('[getCurrentBill] Using cached promise for:', cacheKey)
    return billCreationCache.get(cacheKey)!
  }
  
  // Create the promise and cache it
  const billPromise = getCurrentBillInternal(creditCard, userId, startDate, endDate)
  billCreationCache.set(cacheKey, billPromise)
  
  // Remove from cache after completion (success or error)
  billPromise.finally(() => {
    billCreationCache.delete(cacheKey)
  })
  
  return billPromise
}

async function getCurrentBillInternal(
  creditCard: CreditCard,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CreditCardBill | null> {
  try {
    console.log('[getCurrentBill] Starting for card:', creditCard.id, 'user:', userId)
    
    const { dueDate } = calculateBillingPeriod(creditCard.closingDay, creditCard.dueDay)

    console.log('[getCurrentBill] Billing period:', { startDate, endDate, dueDate })

    // Check if bill already exists for this period
    const q = query(
      collection(db, BILLS_COLLECTION),
      where('creditCardId', '==', creditCard.id),
      where('userId', '==', userId),
      where('closingDate', '==', Timestamp.fromDate(endDate))
    )

    console.log('[getCurrentBill] Querying existing bill...')
    const snapshot = await getDocs(q)
    console.log('[getCurrentBill] Query result:', snapshot.docs.length, 'bills found')
    
    if (!snapshot.empty) {
      // Bill exists, return the first one
      const doc = snapshot.docs[0]
      console.log('[getCurrentBill] Returning existing bill:', doc.id)
      
      // If there are multiple bills for the same period (shouldn't happen), log warning
      if (snapshot.docs.length > 1) {
        console.warn('[getCurrentBill] WARNING: Multiple bills found for same period:', snapshot.docs.length)
      }
      
      return {
        id: doc.id,
        ...doc.data(),
      } as CreditCardBill
    }

    // Bill doesn't exist, create it
    console.log('[getCurrentBill] No existing bill, calculating usage...')
    const usage = await getCreditCardUsage(creditCard.id, userId, startDate, endDate)

    console.log('[getCurrentBill] Creating new bill with usage:', usage.total)
    const billData: Omit<CreditCardBill, 'id'> = {
      creditCardId: creditCard.id,
      householdId: creditCard.householdId,
      userId,
      closingDate: Timestamp.fromDate(endDate),
      dueDate: Timestamp.fromDate(dueDate),
      totalAmount: usage.total,
      paidAmount: 0,
      status: 'open',
      transactions: usage.transactions.map((t) => t.id),
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    console.log('[getCurrentBill] Adding bill to Firestore...')
    const docRef = await addDoc(collection(db, BILLS_COLLECTION), billData)
    console.log('[getCurrentBill] Bill created with ID:', docRef.id)

    return {
      id: docRef.id,
      ...billData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as CreditCardBill
  } catch (error: any) {
    console.error('[getCurrentBill] Error:', error)
    throw new Error(error.message || 'Erro ao gerar fatura')
  }
}

/**
 * Update bill total amount with current usage
 */
export async function updateBillTotal(
  billId: string,
  totalAmount: number,
  transactionIds: string[]
): Promise<void> {
  try {
    await updateDoc(doc(db, BILLS_COLLECTION, billId), {
      totalAmount,
      transactions: transactionIds,
      updatedAt: serverTimestamp(),
    })
    console.log('[updateBillTotal] Updated bill:', billId, 'to', totalAmount)
  } catch (error: any) {
    console.error('[updateBillTotal] Error:', error)
    throw new Error(error.message || 'Erro ao atualizar fatura')
  }
}

/**
 * Pay credit card bill with a bank account
 */
export async function payBill(
  billId: string,
  accountId: string,
  amount: number // in cents
): Promise<void> {
  try {
    const billDoc = await getDoc(doc(db, BILLS_COLLECTION, billId))
    
    if (!billDoc.exists()) {
      throw new Error('Fatura não encontrada')
    }

    const bill = { id: billDoc.id, ...billDoc.data() } as CreditCardBill
    
    const newPaidAmount = bill.paidAmount + amount
    const isPaidInFull = newPaidAmount >= bill.totalAmount

    // Deduct from account
    await adjustAccountBalance(accountId, -amount)

    // Update bill
    const updateData: any = {
      paidAmount: newPaidAmount,
      status: isPaidInFull ? 'paid' : bill.status,
      updatedAt: serverTimestamp(),
    }

    if (isPaidInFull) {
      updateData.paidAt = serverTimestamp()
      updateData.paymentAccountId = accountId
    }

    await updateDoc(doc(db, BILLS_COLLECTION, billId), updateData)
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao pagar fatura')
  }
}

/**
 * Subscribe to bills for a credit card
 */
export function subscribeToBills(
  creditCardId: string,
  userId: string,
  callback: (bills: CreditCardBill[]) => void
): () => void {
  try {
    console.log('[subscribeToBills] Starting subscription for card:', creditCardId, 'user:', userId)
    const q = query(
      collection(db, BILLS_COLLECTION),
      where('creditCardId', '==', creditCardId),
      where('userId', '==', userId),
      orderBy('closingDate', 'desc')
    )

    return onSnapshot(
      q,
      (snapshot) => {
        console.log('[subscribeToUserBills] Success, bills count:', snapshot.docs.length)
        
        // Sort locally since index might still be building
        const sortedBills = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a: any, b: any) => {
            const dateA = a.dueDate?.toDate?.() || new Date(0)
            const dateB = b.dueDate?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          }) as CreditCardBill[]

        callback(sortedBills)
      },
      (error) => {
        console.error('[subscribeToBills] Error in bills snapshot:', error)
        // Call callback with empty array on error
        callback([])
      }
    )
  } catch (error: any) {
    console.error('[subscribeToBills] Error subscribing to bills:', error)
    return () => {}
  }
}

/**
 * Get all bills for a user
 */
export function subscribeToUserBills(
  userId: string,
  callback: (bills: CreditCardBill[]) => void
): () => void {
  try {
    console.log('[subscribeToUserBills] Starting subscription for user:', userId)
    const q = query(
      collection(db, BILLS_COLLECTION),
      where('userId', '==', userId)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        console.log('[subscribeToUserBills] Success, bills count:', snapshot.docs.length)
        
        // Sort locally since index might still be building
        const sortedBills = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a: any, b: any) => {
            const dateA = a.dueDate?.toDate?.() || new Date(0)
            const dateB = b.dueDate?.toDate?.() || new Date(0)
            return dateB.getTime() - dateA.getTime()
          })
        const bills = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CreditCardBill[]

        callback(bills)
      },
      (error) => {
        console.error('[subscribeToUserBills] Error in user bills snapshot:', error)
        // Call callback with empty array on error
        callback([])
      }
    )
  } catch (error: any) {
    console.error('[subscribeToUserBills] Error subscribing to user bills:', error)
    return () => {}
  }
}

/**
 * Close a bill (mark as closed, preventing new transactions)
 */
export async function closeBill(billId: string): Promise<void> {
  try {
    await updateDoc(doc(db, BILLS_COLLECTION, billId), {
      status: 'closed',
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao fechar fatura')
  }
}
