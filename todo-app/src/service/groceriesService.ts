import type { User } from 'firebase/auth'
import type { GroceryItem } from '../Features/groceries/groceryModel'
import { getFirebase } from './firebase'
import { createFirebaseGroceriesService } from './groceriesFirebaseService'

export type GroceriesService = {
  fetchItems: () => Promise<GroceryItem[]>
  subscribeItems?: (
    onItems: (items: GroceryItem[]) => void,
    onError: (error: Error) => void,
  ) => () => void
  replaceAllItems: (items: GroceryItem[]) => Promise<GroceryItem[]>
  saveItem: (item: GroceryItem) => Promise<GroceryItem>
  updateItem: (item: GroceryItem) => Promise<GroceryItem>
  deleteItem: (itemId: string) => Promise<void>
}

export function createGroceriesServiceForUser(user: User): GroceriesService {
  const { db } = getFirebase()
  return createFirebaseGroceriesService(db, user.uid)
}
