import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'

function requireEnv(name: string): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing env var ${name}. Copy .env.example to .env and fill Firebase config.`)
  }
  return value
}

let cached: {
  app: FirebaseApp
  auth: ReturnType<typeof getAuth>
  db: ReturnType<typeof getFirestore>
} | null = null

export function getFirebase() {
  if (cached) return cached

  const app = initializeApp({
    apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  })

  const auth = getAuth(app)
  const db = getFirestore(app)

  // Best-effort offline support; this can fail in some environments.
  enableIndexedDbPersistence(db).catch(() => {
    // ignore
  })

  cached = { app, auth, db }
  return cached
}
