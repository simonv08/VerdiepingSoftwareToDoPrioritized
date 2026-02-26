import type { RepeatRule } from './taskModel'
import { formatIsoDate, parseIsoDate } from './deadline'

export type Repeatable = {
  repeatRule: RepeatRule
  repeatInterval: number | null
  dueDate: string | null
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function getRepeatInterval(item: Pick<Repeatable, 'repeatInterval'>): number {
  if (typeof item.repeatInterval === 'number' && Number.isFinite(item.repeatInterval)) {
    return Math.max(1, Math.trunc(item.repeatInterval))
  }
  return 1
}

export function computeNextDueDate(
  item: Repeatable,
  now: Date = new Date(),
): string | null {
  if (item.repeatRule === 'none') return null

  const interval = getRepeatInterval(item)
  const base = item.dueDate ? parseIsoDate(item.dueDate) : now

  const next = applyRepeatRule(item.repeatRule, base, interval)
  return formatIsoDate(next)
}

export function applyRepeatRule(rule: RepeatRule, base: Date, interval: number): Date {
  switch (rule) {
    case 'daily':
      return addDays(base, interval)
    case 'weekly':
      return addWeeks(base, interval)
    case 'monthly':
      return addMonths(base, interval)
    case 'custom':
      // Treat custom as a day-interval for now (simple local implementation)
      return addDays(base, interval)
    case 'none':
    default:
      return base
  }
}
