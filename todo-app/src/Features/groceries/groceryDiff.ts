import type { GroceryItem } from './groceryModel'

export type GroceryDiff = {
  added: GroceryItem[]
  updated: GroceryItem[]
  removedIds: string[]
}

function stableStringify(item: GroceryItem): string {
  // Enough for small local lists; used only for diffing.
  return JSON.stringify(item)
}

export function diffGroceries(prev: GroceryItem[], next: GroceryItem[]): GroceryDiff {
  const prevById = new Map(prev.map((i) => [i.id, i]))
  const nextById = new Map(next.map((i) => [i.id, i]))

  const added: GroceryItem[] = []
  const updated: GroceryItem[] = []
  const removedIds: string[] = []

  for (const [id, nextItem] of nextById) {
    const prevItem = prevById.get(id)
    if (!prevItem) {
      added.push(nextItem)
    } else if (stableStringify(prevItem) !== stableStringify(nextItem)) {
      updated.push(nextItem)
    }
  }

  for (const [id] of prevById) {
    if (!nextById.has(id)) {
      removedIds.push(id)
    }
  }

  return { added, updated, removedIds }
}
