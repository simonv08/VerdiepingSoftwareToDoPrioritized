import { createTask } from './taskModel'
import type { ManualPriority, RepeatRule, Task } from './taskModel'
import { overdue } from './deadline'
import { computeNextDueDate } from './repeat'

export type NewTaskInput = {
  title: string
  description?: string
  dueDate?: string
  repeatRule?: RepeatRule
  repeatInterval?: number
  manualPriority?: ManualPriority
}

function generateTaskId(now: Date = new Date()): string {
  // Enough for local-only app; can be replaced later by DB ids.
  return `t-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function addTask(tasks: Task[], input: NewTaskInput, now: Date = new Date()): Task[] {
  const title = normalizeText(input.title)
  if (!title) return tasks

  const task = createTask({
    id: generateTaskId(now),
    title,
    description: input.description ? normalizeText(input.description) : null,
    dueDate: input.dueDate ? input.dueDate : null,
    repeatRule: input.repeatRule ?? 'none',
    repeatInterval: typeof input.repeatInterval === 'number' ? input.repeatInterval : null,
    manualPriority: input.manualPriority ?? null,
    completedAt: null,
    archivedAt: null,
  })

  return [task, ...tasks]
}

export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.id !== taskId)
}

export function toggleTaskCompleted(
  tasks: Task[],
  taskId: string,
  now: Date = new Date(),
): Task[] {
  const completedAt = now.toISOString()

  const task = tasks.find((t) => t.id === taskId)
  if (!task) return tasks

  // Reopen: keep it simple (no undo for generated repeat instances)
  if (task.completedAt) {
    return tasks.map((t) =>
      t.id === taskId ? { ...t, completedAt: null, archivedAt: null } : t,
    )
  }

  // Complete
  const didOverdue = overdue(task, now)
  const nextOverdueCount = task.overdueCount + (didOverdue ? 1 : 0)

  if (task.repeatRule !== 'none') {
    const nextDueDate = computeNextDueDate(task, now)
    const archivedOriginal: Task = {
      ...task,
      completedAt,
      archivedAt: completedAt,
      overdueCount: nextOverdueCount,
    }

    const nextTask: Task = createTask({
      id: generateTaskId(now),
      title: task.title,
      description: task.description,
      dueDate: nextDueDate,
      repeatRule: task.repeatRule,
      repeatInterval: task.repeatInterval,
      manualPriority: task.manualPriority,
      completedAt: null,
      archivedAt: null,
      overdueCount: nextOverdueCount,
    })

    return [nextTask, ...tasks.map((t) => (t.id === taskId ? archivedOriginal : t))]
  }

  return tasks.map((t) =>
    t.id === taskId
      ? { ...t, completedAt, archivedAt: null, overdueCount: nextOverdueCount }
      : t,
  )
}
