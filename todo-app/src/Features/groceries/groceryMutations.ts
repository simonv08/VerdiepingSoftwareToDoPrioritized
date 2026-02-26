import type { RepeatRule } from '../tasks/taskModel'
import { formatIsoDate } from '../tasks/deadline'
import { computeNextDueDate } from '../tasks/repeat'
import { createGroceryItem, type GroceryItem } from './groceryModel'

export type NewGroceryItemInput = {
  name: string
  quantity?: string
  dueDate?: string
  repeatRule?: RepeatRule
  repeatInterval?: number
}

function generateId(now: Date = new Date()): string {
  return `g-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function addGroceryItem(
  items: GroceryItem[],
  input: NewGroceryItemInput,
  now: Date = new Date(),
): GroceryItem[] {
  const name = normalizeText(input.name)
  if (!name) return items

  const id = generateId(now)
  const repeatRule: RepeatRule = input.repeatRule ?? 'none'
  const item = createGroceryItem({
    id,
    seriesId: repeatRule === 'none' ? null : id,
    name,
    quantity: input.quantity ? normalizeText(input.quantity) : null,
    dueDate: input.dueDate ?? null,
    repeatRule,
    repeatInterval: typeof input.repeatInterval === 'number' ? input.repeatInterval : null,
    boughtAt: null,
  })

  return [item, ...items]
}

export function deleteGroceryItem(items: GroceryItem[], itemId: string): GroceryItem[] {
  return items.filter((i) => i.id !== itemId)
}

export function toggleGroceryBought(
  items: GroceryItem[],
  itemId: string,
  now: Date = new Date(),
): GroceryItem[] {
  const item = items.find((i) => i.id === itemId)
  if (!item) return items

  // Un-bought
  if (item.boughtAt) {
    if (item.repeatRule !== 'none' && item.seriesId) {
      const expectedNextDue = computeNextDueDate(item, now)
      const nextIdToRemove = expectedNextDue
        ? items.find(
            (i) =>
              i.id !== itemId &&
              i.seriesId === item.seriesId &&
              i.boughtAt === null &&
              i.dueDate === expectedNextDue,
          )?.id
        : undefined

      return items
        .filter((i) => (nextIdToRemove ? i.id !== nextIdToRemove : true))
        .map((i) => (i.id === itemId ? { ...i, boughtAt: null } : i))
    }

    return items.map((i) => (i.id === itemId ? { ...i, boughtAt: null } : i))
  }

  // Bought
  const boughtAt = now.toISOString()

  if (item.repeatRule !== 'none') {
    const seriesId = item.seriesId ?? item.id
    const nextDueDate = computeNextDueDate({
      ...item,
      // Anchor repeat scheduling to “today” when bought.
      dueDate: formatIsoDate(now),
    }, now)

    const boughtOriginal: GroceryItem = { ...item, seriesId, boughtAt }
    const nextItem: GroceryItem = createGroceryItem({
      id: generateId(now),
      seriesId,
      name: item.name,
      quantity: item.quantity,
      dueDate: nextDueDate,
      repeatRule: item.repeatRule,
      repeatInterval: item.repeatInterval,
      boughtAt: null,
    })

    return [nextItem, ...items.map((i) => (i.id === itemId ? boughtOriginal : i))]
  }

  return items.map((i) => (i.id === itemId ? { ...i, boughtAt } : i))
}
