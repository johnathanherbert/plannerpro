// Account service - CRUD operations for bank accounts
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
  increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Account, AccountFormData } from '@/types'

const ACCOUNTS_COLLECTION = 'accounts'

/**
 * Creates a new account
 */
export async function createAccount(
  data: AccountFormData,
  userId: string,
  householdId: string
): Promise<string> {
  try {
    const balanceInCents = Math.round(parseFloat(data.initialBalance) * 100)

    const accountData: Omit<Account, 'id'> = {
      householdId,
      name: data.name,
      type: data.type,
      balance: balanceInCents,
      initialBalance: balanceInCents,
      color: data.color,
      icon: data.icon,
      isActive: true,
      ownerId: userId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    const docRef = await addDoc(collection(db, ACCOUNTS_COLLECTION), accountData)
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar conta')
  }
}

/**
 * Updates an existing account
 */
export async function updateAccount(
  accountId: string,
  data: Partial<AccountFormData>
): Promise<void> {
  try {
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    }

    // Allow updating balance - convert to cents if provided
    if (data.initialBalance !== undefined) {
      const balanceInCents = Math.round(parseFloat(data.initialBalance) * 100)
      updateData.balance = balanceInCents
      updateData.initialBalance = balanceInCents
    }

    await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), updateData)
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar conta')
  }
}

/**
 * Adjusts account balance (used when transactions are created/deleted)
 */
export async function adjustAccountBalance(
  accountId: string,
  amountInCents: number
): Promise<void> {
  try {
    await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), {
      balance: increment(amountInCents),
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao ajustar saldo da conta')
  }
}

/**
 * Deactivates an account (soft delete)
 */
export async function deactivateAccount(accountId: string): Promise<void> {
  try {
    await updateDoc(doc(db, ACCOUNTS_COLLECTION, accountId), {
      isActive: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao desativar conta')
  }
}

/**
 * Deletes an account permanently
 */
export async function deleteAccount(accountId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accountId))
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao deletar conta')
  }
}

/**
 * Gets a single account by ID
 */
export async function getAccount(accountId: string): Promise<Account | null> {
  try {
    const docSnap = await getDoc(doc(db, ACCOUNTS_COLLECTION, accountId))
    
    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Account
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar conta')
  }
}

/**
 * Gets all accounts for a household
 */
export async function getAccounts(householdId: string): Promise<Account[]> {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('householdId', '==', householdId),
      where('isActive', '==', true)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index builds
    )
    
    const snapshot = await getDocs(q)
    
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Account[]
    
    // Sort locally until index is built
    return accounts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar contas')
  }
}

/**
 * Subscribes to accounts for a household with realtime updates
 * Only returns accounts owned by the specified user (personal accounts)
 */
export function subscribeToAccounts(
  householdId: string,
  userId: string,
  callback: (accounts: Account[]) => void
): () => void {
  try {
    const q = query(
      collection(db, ACCOUNTS_COLLECTION),
      where('householdId', '==', householdId),
      where('ownerId', '==', userId),
      where('isActive', '==', true)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index builds
    )

    return onSnapshot(q, (snapshot) => {
      let accounts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Account[]
      
      // Sort locally until index is built
      accounts = accounts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())

      callback(accounts)
    })
  } catch (error: any) {
    console.error('Error subscribing to accounts:', error)
    return () => {}
  }
}
