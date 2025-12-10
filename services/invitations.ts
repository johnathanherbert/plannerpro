// Invitation service - create, accept, reject, and manage invitations
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Invitation, InvitationStatus } from '@/types'
import { addHouseholdMember } from './households'

const INVITATIONS_COLLECTION = 'invitations'

/**
 * Creates a new invitation
 * Generates a unique token for the invitation link
 */
export async function createInvitation(
  householdId: string,
  householdName: string,
  invitedEmail: string,
  inviterId: string,
  inviterName: string
): Promise<string> {
  try {
    // Generate unique token
    const token = generateInvitationToken()

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitationData: Omit<Invitation, 'id'> = {
      householdId,
      householdName,
      invitedEmail: invitedEmail.toLowerCase(),
      inviterId,
      inviterName,
      token,
      status: 'pending',
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp() as any,
    }

    const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitationData)
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar convite')
  }
}

/**
 * Gets invitation by token
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  try {
    const q = query(collection(db, INVITATIONS_COLLECTION), where('token', '==', token))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as Invitation
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar convite')
  }
}

/**
 * Gets pending invitations for an email
 */
export async function getPendingInvitations(email: string): Promise<Invitation[]> {
  try {
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('invitedEmail', '==', email.toLowerCase()),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invitation[]
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar convites')
  }
}

/**
 * Gets all invitations for an email (pending, accepted, rejected)
 * Alias for getPendingInvitations for better naming
 */
export async function getInvitationsByEmail(email: string): Promise<Invitation[]> {
  try {
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('invitedEmail', '==', email.toLowerCase())
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invitation[]
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar convites')
  }
}

/**
 * Accepts an invitation and adds user to household
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string,
  userEmail: string,
  userDisplayName: string
): Promise<void> {
  try {
    // Get invitation
    const invitationDoc = await getDoc(doc(db, INVITATIONS_COLLECTION, invitationId))
    if (!invitationDoc.exists()) {
      throw new Error('Convite não encontrado')
    }

    const invitation = { id: invitationDoc.id, ...invitationDoc.data() } as Invitation

    // Check if invitation is valid
    if (invitation.status !== 'pending') {
      throw new Error('Este convite já foi usado')
    }

    if (invitation.expiresAt.toDate() < new Date()) {
      throw new Error('Este convite expirou')
    }

    if (invitation.invitedEmail !== userEmail.toLowerCase()) {
      throw new Error('Este convite não é para o seu email')
    }

    // Add user to household
    await addHouseholdMember(
      invitation.householdId,
      userId,
      userEmail,
      userDisplayName,
      'member'
    )

    // Update invitation status
    await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao aceitar convite')
  }
}

/**
 * Rejects an invitation
 */
export async function rejectInvitation(invitationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
      status: 'rejected',
    })
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao rejeitar convite')
  }
}

/**
 * Revokes (deletes) an invitation
 * Only the inviter or household owner/admin can revoke
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, INVITATIONS_COLLECTION, invitationId))
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao revogar convite')
  }
}

/**
 * Gets all invitations for a household
 */
export async function getHouseholdInvitations(householdId: string): Promise<Invitation[]> {
  try {
    const q = query(
      collection(db, INVITATIONS_COLLECTION),
      where('householdId', '==', householdId)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invitation[]
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao buscar convites')
  }
}

/**
 * Generates a unique random token for invitation
 */
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Generates invitation link
 */
export function getInvitationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/invite?token=${token}`
}
