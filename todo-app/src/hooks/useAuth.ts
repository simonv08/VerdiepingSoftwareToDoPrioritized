import { useEffect, useState, useCallback } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import { getFirebase } from '../service/firebase'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { useGoogleLogin } from '@react-oauth/google'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

type AuthActions = {
  signInWithGoogle: () => void
  signOut: () => Promise<void>
}

type AuthResult = AuthState & {
  actions: AuthActions
}

function friendlyAuthError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e)
  if (message.includes('missing initial state')) {
    return 'Authentication state lost. Using Native Login instead of Web Login should fix this.'
  }
  return message || 'Unknown auth error'
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
    emit({ user: auth.currentUser, loading: false, error: null })
  } catch (e) {
    emit({ user: null, loading: false, error: friendlyAuthError(e) })
  }
}

export function useAuth(): AuthResult {
  const [state, setState] = useState<AuthState>(cachedState)

  useEffect(() => {
    ensureAuthInit()
    listeners.add(setState)
    setState(cachedState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const webLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!authRef) return
      emit({ ...cachedState, loading: true, error: null })
      try {
        const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token)
        await signInWithCredential(authRef, credential)
      } catch (e) {
        emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
      }
    },
    onError: (error) => {
      emit({ ...cachedState, loading: false, error: 'Google Login Failed: ' + error })
    }
  })
const doGoogleSignIn = useCallback(async () => {
  ensureAuthInit()
  if (!authRef) return

  emit({ ...cachedState, loading: true, error: null })

  try {
    if (Capacitor.isNativePlatform()) {
      const result = await SocialLogin.login({
        provider: 'google',
        options: {
          // IMPORTANT: Use the "Web Client ID", NOT the Android Client ID
          clientId: '188476231988-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
        },
      })

      if (result.result && 'idToken' in result.result && result.result.idToken) {
        const credential = GoogleAuthProvider.credential(result.result.idToken)
        await signInWithCredential(authRef, credential)
        return
      }
    }

    webLogin()
  } catch (e) {
    emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
  }
}, [webLogin])
//   const doGoogleSignIn = useCallback(async () => {
//     ensureAuthInit()
//     if (!authRef) return
//
//     emit({ ...cachedState, loading: true, error: null })
//
//     try {
//       if (Capacitor.isNativePlatform()) {
//         const result = await SocialLogin.login({
//           provider: 'google',
//           options: {},
//         })
//
//         if (result.result && 'idToken' in result.result && result.result.idToken) {
//           const credential = GoogleAuthProvider.credential(result.result.idToken)
//           await signInWithCredential(authRef, credential)
//           return
//         }
//       }
//
//       webLogin()
//     } catch (e) {
//       emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
//     }
//  }, [webLogin])

  const doSignOut = useCallback(async () => {
    ensureAuthInit()
    if (!authRef) return
    emit({ ...cachedState, loading: true, error: null })
    try {
      await signOut(authRef)
    } catch (e) {
      emit({ ...cachedState, loading: false, error: friendlyAuthError(e) })
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
