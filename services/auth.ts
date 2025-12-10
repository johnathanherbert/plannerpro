// Authentication service - handles sign up, sign in, sign out, and OAuth
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'

const googleProvider = new GoogleAuthProvider()

/**
 * Creates a new user with email and password
 * Also creates user document in Firestore
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Update profile with display name
    await updateProfile(firebaseUser, { displayName })

    // Create user document in Firestore
    const userData: any = {
      email: firebaseUser.email!,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Only add photoURL if it exists
    if (firebaseUser.photoURL) {
      userData.photoURL = firebaseUser.photoURL
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userData)

    return {
      id: firebaseUser.uid,
      ...userData,
    } as User
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao criar conta')
  }
}

/**
 * Signs in user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado')
    }

    return {
      id: firebaseUser.uid,
      ...userDoc.data(),
    } as User
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao fazer login')
  }
}

/**
 * Signs in with Google OAuth
 * Creates user document if first time sign in
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user

    // Check if user document exists
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      // First time Google sign in - create user document
      const userData: any = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Only add photoURL if it exists
      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL
      }

      await setDoc(userDocRef, userData)

      return {
        id: firebaseUser.uid,
        ...userData,
      } as User
    }

    return {
      id: firebaseUser.uid,
      ...userDoc.data(),
    } as User
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao fazer login com Google')
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao sair')
  }
}

/**
 * Subscribe to authentication state changes
 * Returns unsubscribe function
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Gets the current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}
