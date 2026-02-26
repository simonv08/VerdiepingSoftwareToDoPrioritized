import type { GroceryItem } from '../Features/groceries/groceryModel'
import type { GroceriesService } from './groceriesService'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

type StoredGrocery = GroceryItem & {
  createdAt?: unknown
  updatedAt?: unknown
}

function stripServerFields(item: GroceryItem): GroceryItem {
  const { createdAt, updatedAt, ...rest } = item as GroceryItem & Record<string, unknown>
  void createdAt
  void updatedAt
  return rest as GroceryItem
}

function groceriesCollection(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'groceries')
}

export function createFirebaseGroceriesService(db: Firestore, uid: string): GroceriesService {
  return {
    async fetchItems() {
      const q = query(groceriesCollection(db, uid), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as GroceryItem)
    },

    subscribeItems(onItems, onError) {
      const q = query(groceriesCollection(db, uid), orderBy('createdAt', 'desc'))
      return onSnapshot(
        q,
        (snap) => {
          onItems(snap.docs.map((d) => d.data() as GroceryItem))
        },
        (err) => onError(err),
      )
    },

    async replaceAllItems(items) {
      const col = groceriesCollection(db, uid)
      const existingSnap = await getDocs(col)
      const existingIds = new Set(existingSnap.docs.map((d) => d.id))
      const nextIds = new Set(items.map((i) => i.id))

      const batch = writeBatch(db)

      for (const item of items) {
        const clean = stripServerFields(item)
        const payload: StoredGrocery = {
          ...clean,
          updatedAt: serverTimestamp(),
          ...(existingIds.has(item.id) ? {} : { createdAt: serverTimestamp() }),
        }
        batch.set(doc(col, item.id), payload, { merge: true })
      }

      for (const d of existingSnap.docs) {
        if (!nextIds.has(d.id)) {
          batch.delete(d.ref)
        }
      }

      await batch.commit()
      return items
    },

    async saveItem(item) {
      const clean = stripServerFields(item)
      if (clean.id) {
        const payload: StoredGrocery = { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
        await setDoc(doc(groceriesCollection(db, uid), item.id), payload)
        return item
      }

      const payload: StoredGrocery = { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      const ref = await addDoc(groceriesCollection(db, uid), payload)
      return { ...item, id: ref.id }
    },

    async updateItem(item) {
      const clean = stripServerFields(item)
      const payload: StoredGrocery = { ...clean, updatedAt: serverTimestamp() }
      await setDoc(doc(groceriesCollection(db, uid), item.id), payload, { merge: true })
      return item
    },

    async deleteItem(itemId) {
      await deleteDoc(doc(groceriesCollection(db, uid), itemId))
    },
  }
}
