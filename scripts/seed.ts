// Seed script - populates Firestore with demo data
// Run with: npm run seed

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

// Note: Replace with your Firebase config or use environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function seed() {
  console.log('🌱 Starting seed process...')

  try {
    // Create demo household
    console.log('Creating demo household...')
    const householdRef = await addDoc(collection(db, 'households'), {
      name: 'Família Demo',
      ownerId: 'demo-user-1',
      members: [
        {
          userId: 'demo-user-1',
          email: 'demo@plannerpro.com',
          displayName: 'João Silva',
          role: 'owner',
          joinedAt: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    console.log(`✅ Household created: ${householdRef.id}`)

    // Create demo transactions
    console.log('Creating demo transactions...')
    
    const transactions = [
      {
        householdId: householdRef.id,
        type: 'income',
        title: 'Salário',
        amount: 500000, // R$ 5000.00
        date: Timestamp.now(),
        category: 'salary',
        payerId: 'demo-user-1',
        target: 'personal',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        householdId: householdRef.id,
        type: 'expense',
        title: 'Supermercado',
        amount: 35000, // R$ 350.00
        date: Timestamp.now(),
        category: 'food',
        payerId: 'demo-user-1',
        target: 'household',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        householdId: householdRef.id,
        type: 'expense',
        title: 'Aluguel',
        amount: 200000, // R$ 2000.00
        date: Timestamp.now(),
        category: 'housing',
        payerId: 'demo-user-1',
        target: 'household',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        householdId: householdRef.id,
        type: 'expense',
        title: 'Gasolina',
        amount: 25000, // R$ 250.00
        date: Timestamp.now(),
        category: 'transport',
        payerId: 'demo-user-1',
        target: 'personal',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ]

    for (const transaction of transactions) {
      await addDoc(collection(db, 'transactions'), transaction)
    }

    console.log(`✅ Created ${transactions.length} demo transactions`)

    console.log('🎉 Seed completed successfully!')
    console.log(`\nDemo credentials:
    Email: demo@plannerpro.com
    Password: (create account manually)
    Household ID: ${householdRef.id}
    `)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }

  process.exit(0)
}

// Run seed
seed()
