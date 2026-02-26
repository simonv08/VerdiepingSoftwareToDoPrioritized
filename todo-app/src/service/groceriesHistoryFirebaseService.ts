import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'

function historyCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'groceryHistory')
}

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function makeDocId(normalized: string) {
  // Firestore doc IDs can't contain '/'. Keep it deterministic and safe.
  return encodeURIComponent(normalized).replaceAll('%', '_').replaceAll('/', '_')
}

export type GroceryHistoryService = {
  subscribeNames: (onNames: (names: string[]) => void, onError: (error: Error) => void) => () => void
  recordName: (name: string) => Promise<void>
}

export function createGroceryHistoryService(db: Firestore, uid: string): GroceryHistoryService {
  return {
    subscribeNames(onNames, onError) {
      const q = query(historyCollection(db, uid), orderBy('lastUsedAt', 'desc'), limit(120))
      return onSnapshot(
        q,
        (snap) => {
          const names = snap.docs
            .map((d) => {
              const data = d.data() as { name?: unknown }
              return typeof data.name === 'string' ? data.name : null
            })
            .filter((n): n is string => Boolean(n && n.trim().length > 0))
          onNames(names)
        },
        (err) => onError(err),
      )
    },

    async recordName(name: string) {
      const normalized = normalizeName(name)
      if (!normalized) return

      const id = makeDocId(normalized)
      await setDoc(
        doc(historyCollection(db, uid), id),
        {
          name: name.trim(),
          normalized,
          lastUsedAt: serverTimestamp(),
        },
        { merge: true },
      )
    },
  }
}
