import type { Task } from './taskModel'
import { daysUntilDue, overdueDays } from './deadline'

function manualPriorityBoost(task: Task): number {
  switch (task.manualPriority) {
    case 'Critical':
      return 1200
    case 'High':
      return 650
    case 'Medium':
      return 250
    case 'Low':
      return 80
    default:
      return 0
  }
}

function repeatIntervalInDays(task: Task): number {
  const interval =
    typeof task.repeatInterval === 'number' && Number.isFinite(task.repeatInterval)
      ? Math.max(1, Math.trunc(task.repeatInterval))
      : 1

  switch (task.repeatRule) {
    case 'daily':
      return interval
    case 'weekly':
      return interval * 7
    case 'monthly':
      return interval * 30
    case 'custom':
      return interval
    case 'none':
    default:
      return Infinity
  }
}

/**
 * Phase 5 priority algorithm.
 * Output is a numeric score where higher = more urgent.
 */
export function calculatePriorityScore(task: Task, now: Date = new Date()): number {
  if (task.archivedAt) return -1_000_000
  if (task.completedAt) return -100_000

  const dueIn = daysUntilDue(task, now)
  const overdue = overdueDays(task, now)
  const repeatDays = repeatIntervalInDays(task)

  let score = 0

  // Manual priority (user intent) is a strong signal
  score += manualPriorityBoost(task)

  // Overdue dominates
  score += overdue * 500
  score += (task.overdueCount || 0) * 120

  // Due soon boosts
  if (typeof dueIn === 'number') {
    if (dueIn < 0) {
      score += 1000
    } else if (dueIn === 0) {
      score += 600
    } else if (dueIn <= 3) {
      score += 400 - dueIn * 80
    } else {
      score += Math.max(0, 120 - dueIn * 8)
    }
  }

  // Shorter repeat interval => slightly higher urgency
  if (Number.isFinite(repeatDays)) {
    score += Math.round(200 / Math.max(1, repeatDays))
  }

  return score
}

export function sortTasksByPriority(tasks: Task[], now: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    const sb = calculatePriorityScore(b, now)
    const sa = calculatePriorityScore(a, now)
    if (sb !== sa) return sb - sa
    return a.title.localeCompare(b.title)
  })
}
