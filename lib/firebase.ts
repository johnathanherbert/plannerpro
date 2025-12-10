// Firebase initialization and configuration
// Modular SDK (v9+) setup with environment variables

'use client'

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Validate Firebase config
if (!firebaseConfig.apiKey) {
  console.error('Firebase config:', firebaseConfig)
  throw new Error('Firebase API key is missing. Check your .env.local file.')
}

// Initialize Firebase (singleton pattern to avoid multiple initializations)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)

// Note: Offline persistence is disabled to avoid state management issues
// You can enable it later if needed, but make sure to handle edge cases properly
// if (typeof window !== 'undefined') {
//   enableIndexedDbPersistence(db).catch((err) => {
//     if (err.code === 'failed-precondition') {
//       console.warn('Firebase persistence failed: Multiple tabs open')
//     } else if (err.code === 'unimplemented') {
//       console.warn('Firebase persistence not supported by this browser')
//     }
//   })
// }

export { app, auth, db, storage }
