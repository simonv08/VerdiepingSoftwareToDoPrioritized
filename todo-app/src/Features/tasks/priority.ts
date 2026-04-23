import type { Task } from './taskModel'
import { daysUntilDue, overdueDays } from './deadline'
import { PRIORITY_CONSTANTS } from './priorityConstants'

function manualPriorityBoost(task: Task): number {
  switch (task.manualPriority) {
    case 'Critical':
      return PRIORITY_CONSTANTS.manualPriority.critical
    case 'High':
      return PRIORITY_CONSTANTS.manualPriority.high
    case 'Medium':
      return PRIORITY_CONSTANTS.manualPriority.medium
    case 'Low':
      return PRIORITY_CONSTANTS.manualPriority.low
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
      return interval * PRIORITY_CONSTANTS.repeatInterval.weekly
    case 'monthly':
      return interval * PRIORITY_CONSTANTS.repeatInterval.monthly
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
  if (task.archivedAt) return PRIORITY_CONSTANTS.penalties.archived
  if (task.completedAt) return PRIORITY_CONSTANTS.penalties.completed

  const dueIn = daysUntilDue(task, now)
  const overdue = overdueDays(task, now)
  const repeatDays = repeatIntervalInDays(task)

  let score = 0

  // Manual priority (user intent) is a strong signal
  score += manualPriorityBoost(task)

  // Overdue dominates
  score += overdue * PRIORITY_CONSTANTS.overdue.baseMultiplier
  score += (task.overdueCount || 0) * PRIORITY_CONSTANTS.overdue.countMultiplier

  // Due soon boosts
  if (typeof dueIn === 'number') {
    if (dueIn < 0) {
      score += PRIORITY_CONSTANTS.dueSoon.past
    } else if (dueIn === 0) {
      score += PRIORITY_CONSTANTS.dueSoon.today
    } else if (dueIn <= 3) {
      score += PRIORITY_CONSTANTS.dueSoon.within3Days.baseScore - dueIn * PRIORITY_CONSTANTS.dueSoon.within3Days.dayPenalty
    } else {
      score += Math.max(0, PRIORITY_CONSTANTS.dueSoon.within7Days.baseScore - dueIn * PRIORITY_CONSTANTS.dueSoon.within7Days.dayPenalty)
    }
  }

  // Shorter repeat interval => slightly higher urgency
  if (Number.isFinite(repeatDays)) {
    score += Math.round(PRIORITY_CONSTANTS.repeatUrgency.boost / Math.max(1, repeatDays))
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
