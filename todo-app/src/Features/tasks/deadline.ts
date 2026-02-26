import type { Task } from './taskModel'

export type TaskStatus = 'Open' | 'Due soon' | 'Overdue' | 'Completed'

export function parseIsoDate(date: string): Date {
  // Expects yyyy-mm-dd
  const [y, m, d] = date.split('-').map((p) => Number(p))
  return new Date(y, m - 1, d)
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const delta = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.trunc(delta / msPerDay)
}

export function daysUntilDue(task: Task, now: Date = new Date()): number | null {
  if (!task.dueDate) return null
  const due = parseIsoDate(task.dueDate)
  return diffDays(now, due)
}

export function overdue(task: Task, now: Date = new Date()): boolean {
  const days = daysUntilDue(task, now)
  return days !== null && days < 0 && !task.completedAt
}

export function overdueDays(task: Task, now: Date = new Date()): number {
  const days = daysUntilDue(task, now)
  if (days === null) return 0
  return days < 0 && !task.completedAt ? Math.abs(days) : 0
}

export function getTaskStatus(task: Task, now: Date = new Date()): TaskStatus {
  if (task.completedAt) return 'Completed'
  const days = daysUntilDue(task, now)
  if (days === null) return 'Open'
  if (days < 0) return 'Overdue'
  if (days <= 3) return 'Due soon'
  return 'Open'
}
