import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import { getFirebase } from '../service/firebase'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

type AuthActions = {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

type AuthResult = AuthState & {
  actions: AuthActions
}

function friendlyAuthError(e: unknown): string {
  const code =
    e && typeof e === 'object' && 'code' in e && typeof (e as { code?: unknown }).code === 'string'
      ? (e as { code: string }).code
      : null

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Auth is not configured for this project yet. In Firebase Console: Authentication → Get started, then Sign-in method → enable Google. Then refresh.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is disabled. In Firebase Console: Authentication → Sign-in method → enable Google. Then refresh.'
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by the browser. Allow popups for this site and try again.'
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing. Try again.'
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Another sign-in popup is already open. Close it and try again.'
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Firebase Auth. In Firebase Console: Authentication → Settings → Authorized domains → add localhost (and/or your domain).'
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
    return 'Invalid Firebase API key. Check VITE_FIREBASE_API_KEY in todo-app/.env matches your Firebase Web App config.'
  }

  return e instanceof Error ? e.message : 'Unknown auth error'
}

let cachedState: AuthState = { user: null, loading: true, error: null }
let authRef: Auth | null = null
let unsubAuth: (() => void) | null = null
const listeners = new Set<(next: AuthState) => void>()

function emit(next: AuthState) {
  cachedState = next
  for (const l of listeners) l(next)
}

function ensureAuthInit() {
  if (unsubAuth) return

  try {
    const { auth } = getFirebase()
    authRef = auth

    unsubAuth = onAuthStateChanged(auth, (u) => {
      emit({ user: u, loading: false, error: null })
    })

    // Do not auto-sign-in anonymously. With Google-only setups, anonymous sign-in would fail
    // and block the app. We simply wait for the user to sign in.
    emit({ user: auth.currentUser, loading: false, error: null })
  } catch (e) {
    emit({ user: null, loading: false, error: friendlyAuthError(e) })
    unsubAuth = () => {
      // no-op
    }
  }
}

async function doGoogleSignIn() {
  ensureAuthInit()
  if (!authRef) {
    emit({ ...cachedState, loading: false, error: 'Firebase backend is not enabled.' })
    return
  }

  emit({ ...cachedState, loading: true, error: null })
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const current = authRef.currentUser
    if (current && current.isAnonymous) {
      await linkWithPopup(current, provider)
      return
    }
    await signInWithPopup(authRef, provider)
  } catch (e) {
    emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
  }
}

async function doSignOut() {
  ensureAuthInit()
  if (!authRef) return
  emit({ ...cachedState, loading: true, error: null })
  try {
    await signOut(authRef)
  } catch (e) {
    emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
  }
}

export function useAuth(): AuthResult {
  const [state, setState] = useState<AuthState>(cachedState)

  useEffect(() => {
    ensureAuthInit()
    listeners.add(setState)
    // Sync immediately in case init happened before subscribe.
    setState(cachedState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    actions: {
      signInWithGoogle: doGoogleSignIn,
      signOut: doSignOut,
    },
  }
}
