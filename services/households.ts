// Household service - CRUD operations and member management
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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Household, HouseholdMember, HouseholdRole, User } from '@/types'

const HOUSEHOLDS_COLLECTION = 'households'
const USERS_COLLECTION = 'users'

/**
 * Creates a new household
 */
export async function createHousehold(
  name: string,
  ownerId: string,
  ownerEmail: string,
  ownerDisplayName: string
): Promise<string> {
  try {
    const now = Timestamp.now()
    
    const member: HouseholdMember = {
      userId: ownerId,
      email: ownerEmail,
      displayName: ownerDisplayName,
      role: 'owner',
      joinedAt: now,
    }

    const householdData: Omit<Household, 'id'> = {
      name,
      ownerId,
      members: [member],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    }

    const docRef = await addDoc(collection(db, HOUSEHOLDS_COLLECTION), householdData)

    // Update user document with householdId
    await updateDoc(doc(db, USERS_COLLECTION, ownerId), {
      householdId: docRef.id,
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar casa')
  }
}

/**
 * Gets household by ID
 */
export async function getHousehold(householdId: string): Promise<Household | null> {
  try {
    const docSnap = await getDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId))
    
    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Household
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar casa')
  }
}

/**
 * Updates household name
 */
export async function updateHouseholdName(householdId: string, name: string): Promise<void> {
  try {
    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      name,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar nome da casa')
  }
}

/**
 * Adds a member to household
 */
export async function addHouseholdMember(
  householdId: string,
  userId: string,
  email: string,
  displayName: string,
  role: HouseholdRole = 'member'
): Promise<void> {
  try {
    const now = Timestamp.now()
    
    const member: HouseholdMember = {
      userId,
      email,
      displayName,
      role,
      joinedAt: now,
    }

    // Add member to household
    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      members: arrayUnion(member),
      updatedAt: serverTimestamp(),
    })

    // Update user's householdId
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      householdId,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao adicionar membro')
  }
}

/**
 * Removes a member from household
 */
export async function removeHouseholdMember(
  householdId: string,
  userId: string
): Promise<void> {
  try {
    // Get household to find member object
    const household = await getHousehold(householdId)
    if (!household) {
      throw new Error('Casa não encontrada')
    }

    const member = household.members.find((m) => m.userId === userId)
    if (!member) {
      throw new Error('Membro não encontrado')
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      throw new Error('Não é possível remover o proprietário')
    }

    // Remove member from household
    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      members: arrayRemove(member),
      updatedAt: serverTimestamp(),
    })

    // Remove householdId from user
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      householdId: null,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao remover membro')
  }
}

/**
 * Updates a member's role
 */
export async function updateMemberRole(
  householdId: string,
  userId: string,
  newRole: HouseholdRole
): Promise<void> {
  try {
    const household = await getHousehold(householdId)
    if (!household) {
      throw new Error('Casa não encontrada')
    }

    // Cannot change owner role
    const member = household.members.find((m) => m.userId === userId)
    if (member?.role === 'owner') {
      throw new Error('Não é possível alterar a função do proprietário')
    }

    // Update members array
    const updatedMembers = household.members.map((m) =>
      m.userId === userId ? { ...m, role: newRole } : m
    )

    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar função do membro')
  }
}

/**
 * Checks if user has permission for an action
 */
export function hasPermission(
  household: Household,
  userId: string,
  action: 'manage_members' | 'edit_household' | 'delete_household'
): boolean {
  const member = household.members.find((m) => m.userId === userId)
  if (!member) return false

  switch (action) {
    case 'delete_household':
      return member.role === 'owner'
    case 'manage_members':
    case 'edit_household':
      return member.role === 'owner' || member.role === 'admin'
    default:
      return false
  }
}

/**
 * Updates user's showMemberTransactions setting
 */
export async function updateShowMemberTransactions(
  householdId: string,
  userId: string,
  enabled: boolean
): Promise<void> {
  try {
    const household = await getHousehold(householdId)
    if (!household) {
      throw new Error('Casa não encontrada')
    }

    // Check if user is a member
    const isMember = household.members.some((m) => m.userId === userId)
    if (!isMember) {
      throw new Error('Usuário não é membro desta casa')
    }

    // Initialize showMemberTransactions if it doesn't exist
    const showMemberTransactions = household.showMemberTransactions || {}
    
    // Update user's setting
    showMemberTransactions[userId] = enabled

    await updateDoc(doc(db, HOUSEHOLDS_COLLECTION, householdId), {
      showMemberTransactions,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao atualizar configuração')
  }
}
