import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, indexedDBLocalPersistence, initializeAuth, browserLocalPersistence } from 'firebase/auth'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyBVciZ2thcdG9ny4MllW8Zz0mi0CDwAT2A",
  authDomain: "todo-6ba77.firebaseapp.com",
  projectId: "todo-6ba77",
  storageBucket: "todo-6ba77.firebasestorage.app",
  messagingSenderId: "188476231988",
  appId: "1:188476231988:web:080034697a544562231561",
  measurementId: "G-0GLG16ETZ6"
};

let cached: {
  app: FirebaseApp
  auth: ReturnType<typeof getAuth>
  db: ReturnType<typeof getFirestore>
  functions: ReturnType<typeof getFunctions>
} | null = null

export function getFirebase() {
  if (cached) return cached

  const app = initializeApp(firebaseConfig)

  // Initialize functions FIRST before Firestore
  const functions = getFunctions(app, 'us-central1')
  
  // Connect to emulator in development if needed
  if (window.location.hostname === 'localhost') {
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001)
    } catch (e) {
      // Emulator already connected or not running
    }
  }

  // Use persistent storage so the login isn't lost when switching apps
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence]
  })

  const db = getFirestore(app)
  enableIndexedDbPersistence(db).catch(() => {})

  cached = { app, auth, db, functions }
  return cached
}
