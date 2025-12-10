// Credit card service - CRUD operations for credit cards
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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
import { CreditCard, CreditCardFormData } from '@/types'

const CREDIT_CARDS_COLLECTION = 'creditCards'

/**
 * Creates a new credit card
 */
export async function createCreditCard(
  data: CreditCardFormData,
  userId: string,
  householdId: string
): Promise<string> {
  try {
    const limitInCents = Math.round(parseFloat(data.limit) * 100)

    const cardData: Omit<CreditCard, 'id'> = {
      householdId,
      name: data.name,
      lastFourDigits: data.lastFourDigits,
      limit: limitInCents,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      color: data.color,
      icon: data.icon,
      isActive: true,
      ownerId: userId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    const docRef = await addDoc(collection(db, CREDIT_CARDS_COLLECTION), cardData)
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar cartão de crédito')
  }
}

/**
 * Updates an existing credit card
 */
export async function updateCreditCard(
  cardId: string,
  data: Partial<CreditCardFormData>
): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    }

    // Convert limit if provided
    if (data.limit) {
      updateData.limit = Math.round(parseFloat(data.limit) * 100)
    }

    await updateDoc(doc(db, CREDIT_CARDS_COLLECTION, cardId), updateData)
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar cartão de crédito')
  }
}

/**
 * Deactivates a credit card (soft delete)
 */
export async function deactivateCreditCard(cardId: string): Promise<void> {
  try {
    await updateDoc(doc(db, CREDIT_CARDS_COLLECTION, cardId), {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao desativar cartão')
  }
}

/**
 * Deletes a credit card permanently
 */
export async function deleteCreditCard(cardId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CREDIT_CARDS_COLLECTION, cardId))
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao deletar cartão')
  }
}

/**
 * Gets a single credit card by ID
 */
export async function getCreditCard(cardId: string): Promise<CreditCard | null> {
  try {
    const docSnap = await getDoc(doc(db, CREDIT_CARDS_COLLECTION, cardId))
    
    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as CreditCard
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar cartão')
  }
}

/**
 * Gets all credit cards for a household
 */
export async function getCreditCards(householdId: string): Promise<CreditCard[]> {
  try {
    const q = query(
      collection(db, CREDIT_CARDS_COLLECTION),
      where('householdId', '==', householdId),
      where('isActive', '==', true)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index builds
    )
    
    const snapshot = await getDocs(q)
    
    const cards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CreditCard[]
    
    // Sort locally until index is built
    return cards.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar cartões')
  }
}

/**
 * Subscribes to credit cards for a household with realtime updates
 * Only returns cards owned by the specified user (personal cards)
 */
export function subscribeToCreditCards(
  householdId: string,
  userId: string,
  callback: (cards: CreditCard[]) => void
): () => void {
  try {
    const q = query(
      collection(db, CREDIT_CARDS_COLLECTION),
      where('householdId', '==', householdId),
      where('ownerId', '==', userId),
      where('isActive', '==', true)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index builds
    )

    return onSnapshot(
      q,
      (snapshot) => {
        let cards = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CreditCard[]
        
        // Sort locally until index is built
        cards = cards.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

        callback(cards)
      },
      (error) => {
        console.error('[subscribeToCreditCards] Error:', error)
        console.error('[subscribeToCreditCards] Query params:', { householdId, userId })
        callback([])
      }
    )
  } catch (error: any) {
    console.error('Error subscribing to credit cards:', error)
    return () => {}
  }
}

/**
 * Calculates the total used amount on a credit card for a specific period
 */
export async function getCreditCardUsage(
  cardId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // This would query transactions with this creditCardId in the date range
  // Implementation depends on your transaction structure
  // For now, returning 0 as placeholder
  return 0
}
