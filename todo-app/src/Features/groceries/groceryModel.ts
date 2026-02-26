import type { RepeatRule } from '../tasks/taskModel'

export type GroceryItem = {
  id: string
  seriesId: string | null
  name: string
  quantity: string | null
  dueDate: string | null
  repeatRule: RepeatRule
  repeatInterval: number | null
  boughtAt: string | null
}

export function createGroceryItem(
  input: Partial<GroceryItem> & Pick<GroceryItem, 'id' | 'name'>,
): GroceryItem {
  return {
    id: input.id,
    seriesId: input.seriesId ?? null,
    name: input.name,
    quantity: input.quantity ?? null,
    dueDate: input.dueDate ?? null,
    repeatRule: input.repeatRule ?? 'none',
    repeatInterval: input.repeatInterval ?? null,
    boughtAt: input.boughtAt ?? null,
  }
}
