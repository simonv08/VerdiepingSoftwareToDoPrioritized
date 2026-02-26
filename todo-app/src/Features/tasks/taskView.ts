import type { Task } from './taskModel'
import { daysUntilDue, getTaskStatus } from './deadline'
import { calculatePriorityScore } from './priority'

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type TaskView = {
  status: ReturnType<typeof getTaskStatus>
  dueInDays: number | null
  priorityScore: number
  priorityLevel: PriorityLevel
}

export function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 1500) return 'Critical'
  if (score >= 800) return 'High'
  if (score >= 250) return 'Medium'
  return 'Low'
}

export function getTaskView(task: Task, now: Date = new Date()): TaskView {
  const status = getTaskStatus(task, now)
  const dueInDays = daysUntilDue(task, now)
  const priorityScore = calculatePriorityScore(task, now)
  const priorityLevel = getPriorityLevel(priorityScore)

  return { status, dueInDays, priorityScore, priorityLevel }
}
